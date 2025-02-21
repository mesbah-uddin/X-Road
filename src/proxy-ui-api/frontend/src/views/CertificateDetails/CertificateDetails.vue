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
  <div class="certificate-details-wrapper xrd-default-shadow">
    <xrd-sub-view-title :title="$t('cert.certificate')" @close="close" />
    <div class="pl-4">
      <div class="details-view-tools" v-if="certificate">
        <xrd-button
          v-if="showActivate"
          class="button-spacing"
          outlined
          @click="activateCertificate(certificate.certificate_details.hash)"
          data-test="activate-button"
          >{{ $t('action.activate') }}</xrd-button
        >
        <xrd-button
          v-if="showDisable"
          class="button-spacing"
          outlined
          @click="deactivateCertificate(certificate.certificate_details.hash)"
          data-test="deactivate-button"
          >{{ $t('action.deactivate') }}</xrd-button
        >
        <xrd-button
          v-if="showUnregister"
          class="button-spacing"
          outlined
          @click="confirmUnregisterCertificate = true"
          data-test="unregister-button"
          >{{ $t('action.unregister') }}</xrd-button
        >
        <xrd-button
          v-if="showDelete"
          class="button-spacing"
          outlined
          @click="showConfirmDelete()"
          data-test="delete-button"
        >
          <v-icon class="xrd-large-button-icon">icon-Declined</v-icon>

          {{ $t('action.delete') }}</xrd-button
        >
      </div>
      <template v-if="certificate && certificate.certificate_details">
        <div class="cert-hash-wrapper">
          <certificateHash :hash="certificate.certificate_details.hash" />
        </div>
        <certificateInfo :certificate="certificate.certificate_details" />
      </template>
    </div>

    <!-- Confirm dialog for delete -->
    <xrd-confirm-dialog
      :dialog="confirm"
      title="cert.deleteCertTitle"
      text="cert.deleteCertConfirm"
      @cancel="confirm = false"
      @accept="deleteCertificate()"
    />

    <!-- Confirm dialog for unregister certificate -->
    <xrd-confirm-dialog
      :dialog="confirmUnregisterCertificate"
      :loading="unregisterLoading"
      title="keys.unregisterTitle"
      text="keys.unregisterText"
      @cancel="confirmUnregisterCertificate = false"
      @accept="unregisterCert()"
    />

    <!-- Confirm dialog for unregister error handling -->
    <UnregisterErrorDialog
      v-if="unregisterErrorResponse"
      :errorResponse="unregisterErrorResponse"
      :dialog="confirmUnregisterError"
      @cancel="confirmUnregisterError = false"
      @accept="markForDeletion()"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as api from '@/util/api';
import { Permissions } from '@/global';
import {
  TokenCertificate,
  PossibleActions as PossibleActionsList,
  KeyUsageType,
  PossibleAction,
} from '@/openapi-types';
import CertificateInfo from '@/components/certificate/CertificateInfo.vue';
import CertificateHash from '@/components/certificate/CertificateHash.vue';
import UnregisterErrorDialog from './UnregisterErrorDialog.vue';
import { encodePathParameter } from '@/util/api';
import { PossibleActions } from '@/openapi-types/models/PossibleActions';

export default Vue.extend({
  components: {
    CertificateInfo,
    CertificateHash,
    UnregisterErrorDialog,
  },
  props: {
    hash: {
      type: String,
      required: true,
    },
    usage: {
      type: String,
      required: false,
    },
  },
  data() {
    return {
      confirm: false,
      certificate: undefined as TokenCertificate | undefined,
      possibleActions: [] as PossibleActions,
      confirmUnregisterCertificate: false,
      confirmUnregisterError: false,
      unregisterLoading: false,
      unregisterErrorResponse: undefined as undefined | Record<string, unknown>,
    };
  },
  computed: {
    showDelete(): boolean {
      if (this.possibleActions.includes(PossibleAction.DELETE)) {
        if (this.usage === KeyUsageType.SIGNING) {
          return this.$store.getters.hasPermission(
            Permissions.DELETE_SIGN_CERT,
          );
        } else if (this.usage === KeyUsageType.AUTHENTICATION) {
          return this.$store.getters.hasPermission(
            Permissions.DELETE_AUTH_CERT,
          );
        } else {
          return this.$store.getters.hasPermission(
            Permissions.DELETE_UNKNOWN_CERT,
          );
        }
      } else {
        return false;
      }
    },

    showUnregister(): boolean {
      if (
        this.possibleActions.includes(PossibleAction.UNREGISTER) &&
        this.$store.getters.hasPermission(Permissions.SEND_AUTH_CERT_DEL_REQ)
      ) {
        return true;
      } else {
        return false;
      }
    },

    showActivate(): boolean {
      if (this.certificate === null) {
        return false;
      }

      if (this.possibleActions.includes(PossibleAction.ACTIVATE)) {
        if (this.usage === KeyUsageType.SIGNING) {
          return this.$store.getters.hasPermission(
            Permissions.ACTIVATE_DISABLE_SIGN_CERT,
          );
        } else {
          return this.$store.getters.hasPermission(
            Permissions.ACTIVATE_DISABLE_AUTH_CERT,
          );
        }
      }

      return false;
    },

    showDisable(): boolean {
      if (this.certificate === null) {
        return false;
      }

      if (this.possibleActions.includes(PossibleAction.DISABLE)) {
        if (this.usage === KeyUsageType.SIGNING) {
          return this.$store.getters.hasPermission(
            Permissions.ACTIVATE_DISABLE_SIGN_CERT,
          );
        } else {
          return this.$store.getters.hasPermission(
            Permissions.ACTIVATE_DISABLE_AUTH_CERT,
          );
        }
      }

      return false;
    },
  },

  methods: {
    close(): void {
      this.$router.go(-1);
    },
    fetchData(hash: string): void {
      // Fetch certificate data
      api
        .get<TokenCertificate>(
          `/token-certificates/${encodePathParameter(hash)}`,
        )
        .then((res) => {
          this.certificate = res.data;
        })
        .catch((error) => {
          this.$store.dispatch('showError', error);
        });

      // Fetch possible actions
      api
        .get<PossibleActionsList>(
          `/token-certificates/${hash}/possible-actions`,
        )
        .then((res) => {
          this.possibleActions = res.data;
        })
        .catch((error) => {
          this.$store.dispatch('showError', error);
        });
    },
    showConfirmDelete(): void {
      this.confirm = true;
    },
    deleteCertificate(): void {
      this.confirm = false;

      api
        .remove(`/token-certificates/${encodePathParameter(this.hash)}`)
        .then(() => {
          this.close();
          this.$store.dispatch('showSuccess', 'cert.certDeleted');
        })
        .catch((error) => {
          this.$store.dispatch('showError', error);
        });
    },
    activateCertificate(hash: string): void {
      api
        .put(`/token-certificates/${encodePathParameter(hash)}/activate`, hash)
        .then(() => {
          this.$store.dispatch('showSuccess', 'cert.activateSuccess');
          this.fetchData(this.hash);
        })
        .catch((error) => this.$store.dispatch('showError', error));
    },
    deactivateCertificate(hash: string): void {
      api
        .put(`token-certificates/${encodePathParameter(hash)}/disable`, hash)
        .then(() => {
          this.$store.dispatch('showSuccess', 'cert.disableSuccess');
          this.fetchData(this.hash);
        })
        .catch((error) => this.$store.dispatch('showError', error));
    },

    unregisterCert(): void {
      this.unregisterLoading = true;

      if (!this.certificate) {
        return;
      }

      api
        .put(
          `/token-certificates/${this.certificate.certificate_details.hash}/unregister`,
          {},
        )
        .then(() => {
          this.$store.dispatch('showSuccess', 'keys.certificateUnregistered');
        })
        .catch((error) => {
          if (
            error?.response?.data?.error?.code ===
            'management_request_sending_failed'
          ) {
            this.unregisterErrorResponse = error.response;
          } else {
            this.$store.dispatch('showError', error);
          }

          this.confirmUnregisterError = true;
        })
        .finally(() => {
          this.confirmUnregisterCertificate = false;
          this.unregisterLoading = false;
        });
    },

    markForDeletion(): void {
      if (!this.certificate) {
        return;
      }

      api
        .put(
          `/token-certificates/${this.certificate.certificate_details.hash}/mark-for-deletion`,
          {},
        )
        .then(() => {
          this.$store.dispatch('showSuccess', 'keys.certMarkedForDeletion');
          this.confirmUnregisterError = false;
          this.$emit('refresh-list');
        })
        .catch((error) => {
          this.$store.dispatch('showError', error);
          this.confirmUnregisterError = false;
        });
    },
  },
  created() {
    this.fetchData(this.hash);
  },
});
</script>

<style lang="scss" scoped>
@import '~styles/detail-views';

.button-spacing {
  margin-left: 20px;
}
</style>
