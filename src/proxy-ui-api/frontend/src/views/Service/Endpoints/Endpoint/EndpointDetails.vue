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
  <div class="xrd-tab-max-width main-wrap" data-test="endpoint-details-dialog">
    <div class="px-4 pt-4">
      <xrd-sub-view-title :title="$t('endpoints.details')" @close="close" />
      <div class="delete-wrap">
        <xrd-button
          v-if="showDelete"
          @click="showDeletePopup()"
          outlined
          data-test="delete-endpoint"
          >{{ $t('action.delete') }}</xrd-button
        >
      </div>
    </div>

    <ValidationObserver ref="form" v-slot="{ invalid }">
      <div class="px-4">
        <div class="dlg-edit-row">
          <v-select
            class="dlg-row-input"
            @input="touched = true"
            data-test="endpoint-method"
            v-model="endpoint.method"
            :label="$t('endpoints.httpRequestMethod')"
            autofocus
            outlined
            :items="methods"
          />
        </div>

        <div class="dlg-edit-row">
          <ValidationProvider
            rules="required|xrdEndpoint"
            ref="path"
            name="path"
            class="validation-provider dlg-row-input"
            v-slot="{ errors }"
          >
            <v-text-field
              v-model="endpoint.path"
              outlined
              :error-messages="errors"
              name="path"
              :label="$t('endpoints.path')"
              data-test="endpoint-path"
              @input="touched = true"
            ></v-text-field>
          </ValidationProvider>
        </div>

        <div class="helper-text pl-2">
          <div>
            <div>{{ $t('endpoints.endpointHelp1') }}</div>
            <div>{{ $t('endpoints.endpointHelp2') }}</div>
            <div>{{ $t('endpoints.endpointHelp3') }}</div>
            <div>{{ $t('endpoints.endpointHelp4') }}</div>
          </div>
        </div>
      </div>
      <div class="footer-buttons-wrap">
        <xrd-button @click="close()" outlined>{{
          $t('action.cancel')
        }}</xrd-button>
        <xrd-button
          class="save-button"
          :loading="saveBusy"
          @click="saveEndpoint()"
          :disabled="!touched || invalid"
          >{{ $t('action.save') }}</xrd-button
        >
      </div>
    </ValidationObserver>

    <!-- Confirm dialog delete REST -->
    <xrd-confirm-dialog
      :dialog="confirmDelete"
      title="endpoints.deleteTitle"
      text="endpoints.deleteEndpointText"
      @cancel="confirmDelete = false"
      @accept="deleteEndpoint(id)"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as api from '@/util/api';
import { Permissions } from '@/global';
import { ValidationObserver, ValidationProvider } from 'vee-validate';
import { Endpoint } from '@/openapi-types';
import { encodePathParameter } from '@/util/api';

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
  data() {
    return {
      endpoint: {} as Endpoint,
      confirmDelete: false,
      saveBusy: false,
      touched: false,
      methods: [
        { text: this.$t('endpoints.all'), value: '*' },
        { text: 'GET', value: 'GET' },
        { text: 'POST', value: 'POST' },
        { text: 'PUT', value: 'PUT' },
        { text: 'PATCH', value: 'PATCH' },
        { text: 'DELETE', value: 'DELETE' },
        { text: 'HEAD', value: 'HEAD' },
        { text: 'OPTIONS', value: 'OPTIONS' },
        { text: 'TRACE', value: 'TRACE' },
      ],
    };
  },
  computed: {
    showDelete(): boolean {
      return this.$store.getters.hasPermission(Permissions.DELETE_ENDPOINT);
    },
  },
  methods: {
    close(): void {
      this.$router.go(-1);
    },
    showDeletePopup(): void {
      this.confirmDelete = true;
    },
    deleteEndpoint(id: string): void {
      api
        .remove(`/endpoints/${encodePathParameter(id)}`)
        .then(() => {
          this.$store.dispatch('showSuccess', 'endpoints.deleteSuccess');
          this.$router.go(-1);
        })
        .catch((error) => {
          this.$store.dispatch('showError', error.message);
          this.confirmDelete = false;
        });
    },
    saveEndpoint(): void {
      if (!this.endpoint.id) {
        throw new Error('Unable to save endpoint: Endpoint id not defined!');
      }
      api
        .patch(
          `/endpoints/${encodePathParameter(this.endpoint.id)}`,
          this.endpoint,
        )
        .then(() => {
          this.$store.dispatch('showSuccess', 'endpoints.editSuccess');
          this.$router.go(-1);
        })
        .catch((error) => {
          this.$store.dispatch('showError', error);
        });
    },
    fetchData(id: string): void {
      api
        .get<Endpoint>(`/endpoints/${encodePathParameter(id)}`)
        .then((endpoint) => {
          this.endpoint = endpoint.data;
        })
        .catch((error) => {
          this.$store.dispatch('showError', error.message);
        });
    },
  },
  created(): void {
    this.fetchData(this.id);
  },
});
</script>

<style lang="scss" scoped>
@import '~styles/dialogs';
@import '~styles/tables';

.delete-wrap {
  margin-top: 50px;
  display: flex;
  justify-content: flex-end;
}

.dlg-edit-row .dlg-row-title {
  min-width: 200px;
}

.dlg-row-input {
  max-width: 400px;
}

.save-button {
  margin-left: 20px;
}

.helper-text {
  color: $XRoad-Grey60;
}
</style>
