<!--
   The MIT License
   Copyright (c) 2019- Nordic Institute for Interoperability Solutions (NIIS)
   Copyright (c) 2018 Estonian Information System Authority (RIA),
   Nordic Institute for Interoperability Solutions (NIIS), Population Register Centre (VRK)
   Copyright (c) 2015-2017 Estonian Information System Authority (RIA), Population Register Centre (VRK)

   Permission is hereby granted, free of charge, to any person obtaining a copy
   of this software and associated documentation files (the "Software"), to deal
   in the Software without restriction, including without limitation the rights
   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   copies of the Software, and to permit persons to whom the Software is
   furnished to do so, subject to the following conditions:

   The above copyright notice and this permission notice shall be included in
   all copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   THE SOFTWARE.
 -->
<template>
  <div class="xrd-tab-max-width detail-view-outer">
    <ValidationObserver ref="form" v-slot="{ dirty, invalid }">
      <div class="detail-view-content">
        <xrd-sub-view-title :title="$t('keys.tokenDetails')" @close="close" />
        <v-row>
          <v-col>
            <h3>{{ $t('keys.tokenInfo') }}</h3>
            <div class="d-flex">
              <div class="row-title">{{ $t('keys.tokenId') }}</div>
              <div class="row-data text-break">{{ token.id }}</div>
            </div>
            <div class="d-flex">
              <div class="row-title">{{ $t('keys.type') }}</div>
              <div class="row-data">{{ token.type }}</div>
            </div>
          </v-col>

          <v-col>
            <v-row no-gutters>
              <ValidationProvider
                rules="required"
                name="token.friendlyName"
                v-slot="{ errors }"
                class="validation-provider"
              >
                <v-text-field
                  v-model="token.name"
                  class="code-input"
                  name="token.friendlyName"
                  type="text"
                  outlined
                  :label="$t('keys.friendlyName')"
                  :maxlength="255"
                  :error-messages="errors"
                  :loading="loading"
                  :disabled="!(hasEditPermission && canEditName())"
                  @input="isFriendlyNameFieldDirty = true"
                  data-test="token-friendly-name"
                  autofocus
                ></v-text-field>
              </ValidationProvider>
            </v-row>
            <v-row v-if="isSoftwareToken() && canUpdatePin" no-gutters>
              <xrd-expandable
                class="expandable"
                @open="toggleChangePinOpen"
                @close="toggleChangePinOpen"
                :isOpen="isChangePinOpen"
                :isDisabled="!isTokenLoggedIn()"
                data-test="token-open-pin-change-button"
              >
                <template v-slot:link>
                  <div
                    :class="isTokenLoggedIn() && 'pointer'"
                    @click="toggleChangePinOpen"
                    data-test="token-open-pin-change-link"
                  >
                    <span class="font-weight-black">{{
                      $t('token.changePin')
                    }}</span>
                  </div>
                </template>
                <template v-slot:content>
                  <v-row no-gutters>
                    <ValidationProvider
                      rules="required"
                      name="token.oldPin"
                      v-slot="{ errors }"
                      class="validation-provider"
                    >
                      <v-text-field
                        v-model="tokenPinUpdate.old_pin"
                        class="code-input"
                        name="token.oldPin"
                        type="password"
                        outlined
                        :label="$t('fields.token.oldPin')"
                        :maxlength="255"
                        :error-messages="errors"
                        :loading="loading"
                        data-test="token-change-pin-old"
                      ></v-text-field>
                    </ValidationProvider>
                  </v-row>
                  <v-row no-gutters>
                    <ValidationProvider
                      rules="required|confirmed:confirm"
                      name="token.newPin"
                      v-slot="{ errors }"
                      class="validation-provider"
                    >
                      <v-text-field
                        v-model="tokenPinUpdate.new_pin"
                        class="code-input"
                        name="token.newPin"
                        type="password"
                        outlined
                        :label="$t('fields.token.newPin')"
                        :maxlength="255"
                        :error-messages="errors"
                        :loading="loading"
                        data-test="token-change-pin-new"
                      ></v-text-field>
                    </ValidationProvider>
                  </v-row>
                  <v-row no-gutters>
                    <ValidationProvider
                      rules="required"
                      vid="confirm"
                      name="token.newPinConfirm"
                      v-slot="{ errors }"
                      class="validation-provider"
                    >
                      <v-text-field
                        v-model="newPinConfirm"
                        class="code-input"
                        name="token.newPinConfirm"
                        type="password"
                        outlined
                        :label="$t('fields.token.newPinConfirm')"
                        :maxlength="255"
                        :error-messages="errors"
                        :loading="loading"
                        data-test="token-change-pin-new-confirm"
                      ></v-text-field>
                    </ValidationProvider>
                  </v-row>
                </template>
              </xrd-expandable>
            </v-row>
          </v-col>
        </v-row>
      </div>
      <div class="footer-button-wrap">
        <xrd-button @click="close()" outlined data-test="token-details-cancel"
          >{{ $t('action.cancel') }}
        </xrd-button>
        <xrd-button
          :loading="saveBusy"
          @click="save()"
          :disabled="!dirty || invalid"
          data-test="token-details-save"
          >{{ $t('action.save') }}
        </xrd-button>
      </div>
    </ValidationObserver>
  </div>
</template>

<script lang="ts">
/***
 * Component for showing the details of a token.
 */
import Vue from 'vue';
import * as api from '@/util/api';
import { encodePathParameter } from '@/util/api';
import { ValidationObserver, ValidationProvider } from 'vee-validate';
import { Permissions } from '@/global';
import {
  PossibleAction,
  Token,
  TokenPinUpdate,
  TokenType,
} from '@/openapi-types';

export default Vue.extend({
  components: {
    ValidationProvider,
    ValidationObserver,
  },
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  computed: {
    hasEditPermission(): boolean {
      return this.$store.getters.hasPermission(
        Permissions.EDIT_TOKEN_FRIENDLY_NAME,
      );
    },
    canUpdatePin(): boolean {
      return this.$store.getters.hasPermission(Permissions.UPDATE_TOKEN_PIN);
    },
  },
  data() {
    return {
      saveBusy: false,
      loading: false,
      token: {} as Token,
      tokenPinUpdate: {} as TokenPinUpdate,
      isChangePinOpen: false,
      isFriendlyNameFieldDirty: false,
      newPinConfirm: '',
    };
  },
  methods: {
    close(): void {
      this.$router.go(-1);
    },

    async save(): Promise<void> {
      this.saveBusy = true;

      try {
        let successMsg = this.$t('keys.tokenSaved') as string;
        if (this.isChangePinOpen) {
          await api.put(
            `/tokens/${encodePathParameter(this.id)}/pin`,
            this.tokenPinUpdate,
          );
          successMsg = this.$t('token.pinChanged') as string;
        }
        if (this.isFriendlyNameFieldDirty) {
          await api.patch(
            `/tokens/${encodePathParameter(this.id)}`,
            this.token,
          );
        }
        await this.$store.dispatch('showSuccessRaw', successMsg);
        this.$router.go(-1);
      } catch (error) {
        await this.$store.dispatch('showError', error);
      } finally {
        this.saveBusy = false;
      }
    },

    fetchData(): void {
      this.loading = true;
      api
        .get<Token>(`/tokens/${encodePathParameter(this.id)}`)
        .then((res) => {
          this.token = res.data;
        })
        .catch((error) => {
          this.$store.dispatch('showError', error);
        })
        .finally(() => {
          this.loading = false;
        });
    },

    canEditName(): boolean {
      return (
        this.token?.possible_actions?.includes(
          PossibleAction.EDIT_FRIENDLY_NAME,
        ) ?? false
      );
    },

    isTokenLoggedIn(): boolean {
      return (
        this.token.possible_actions?.includes(
          PossibleAction.TOKEN_CHANGE_PIN,
        ) ?? false
      );
    },

    isSoftwareToken(): boolean {
      return this.token.type === TokenType.SOFTWARE;
    },

    toggleChangePinOpen(): void {
      if (!this.isTokenLoggedIn()) {
        return;
      }
      this.isChangePinOpen = !this.isChangePinOpen;
      this.tokenPinUpdate.old_pin = '';
      this.tokenPinUpdate.new_pin = '';
      this.newPinConfirm = '';
    },
  },
  created() {
    this.fetchData();
  },
});
</script>

<style lang="scss" scoped>
@import '../../assets/detail-views';

.code-input {
  width: 450px;
}

.expandable::v-deep .exp-header {
  padding: 0;
  margin-left: -12px;
}
</style>
