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
      <template v-if="certificate">
        <div class="cert-hash-wrapper">
          <certificateHash :hash="certificate.hash" />
        </div>
        <certificateInfo :certificate="certificate" />
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as api from '@/util/api';
import { CertificateDetails } from '@/openapi-types';
import CertificateInfo from '@/components/certificate/CertificateInfo.vue';
import CertificateHash from '@/components/certificate/CertificateHash.vue';

export default Vue.extend({
  components: {
    CertificateInfo,
    CertificateHash,
  },
  props: {},
  data() {
    return {
      certificate: undefined as CertificateDetails | undefined,
    };
  },
  methods: {
    close(): void {
      this.$router.go(-1);
    },
    fetchData(): void {
      api
        .get<CertificateDetails>('/system/certificate')
        .then((res) => {
          this.certificate = res.data;
        })
        .catch((error) => {
          this.$store.dispatch('showError', error);
        });
    },
  },
  created() {
    this.fetchData();
  },
});
</script>

<style lang="scss" scoped>
@import '~styles/detail-views';
@import '~styles/wizards';
</style>
