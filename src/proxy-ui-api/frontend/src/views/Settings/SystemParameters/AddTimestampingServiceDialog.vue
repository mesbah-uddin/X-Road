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
  <v-dialog
    v-model="show"
    max-width="550"
    persistent
    data-test="system-parameters-add-timestamping-service-dialog"
  >
    <template v-slot:activator="{ on: { click } }">
      <xrd-button
        data-test="system-parameters-timestamping-services-add-button"
        outlined
        @click="click"
        :disabled="selectableTimestampingServices.length === 0"
      >
        <v-icon class="xrd-large-button-icon">icon-Add</v-icon>
        {{ $t('systemParameters.timestampingServices.action.add.button') }}
      </xrd-button>
    </template>
    <v-card class="xrd-card">
      <v-card-title>
        <span data-test="dialog-title" class="headline">{{
          $t('systemParameters.timestampingServices.action.add.dialog.title')
        }}</span>
      </v-card-title>
      <v-card-text class="content-wrapper">
        <v-container>
          <v-row>
            <v-col>
              {{
                $t(
                  'systemParameters.timestampingServices.action.add.dialog.info',
                )
              }}
            </v-col>
          </v-row>
          <v-radio-group
            v-model="selectedTimestampingServiceName"
            data-test="system-parameters-add-timestamping-service-dialog-radio-group"
          >
            <v-row
              class="option-row"
              v-for="timestampingService in selectableTimestampingServices"
              :key="timestampingService.name"
            >
              <v-col>
                <v-radio
                  :name="timestampingService.name"
                  :label="timestampingService.name"
                  :value="timestampingService.name"
                />
              </v-col>
            </v-row>
          </v-radio-group>
        </v-container>
      </v-card-text>
      <v-card-actions class="xrd-card-actions">
        <v-spacer></v-spacer>
        <xrd-button
          data-test="system-parameters-add-timestamping-service-dialog-cancel-button"
          outlined
          @click="close"
        >
          {{ $t('action.cancel') }}</xrd-button
        >
        <xrd-button
          data-test="system-parameters-add-timestamping-service-dialog-add-button"
          :loading="loading"
          :disabled="selectedTimestampingService === undefined"
          @click="add"
        >
          <v-icon class="xrd-large-button-icon">icon-Add</v-icon
          >{{ $t('action.add') }}</xrd-button
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import * as api from '@/util/api';
import { Permissions } from '@/global';
import { Prop } from 'vue/types/options';
import { TimestampingService } from '@/openapi-types';

export default Vue.extend({
  name: 'AddTimestampingServiceDialog',
  props: {
    configuredTimestampingServices: {
      type: Array as Prop<TimestampingService[]>,
      required: true,
    },
  },
  data() {
    return {
      loading: false,
      show: false,
      approvedTimestampingServices: [] as TimestampingService[],
      selectedTimestampingServiceName: '',
      permissions: Permissions,
    };
  },
  computed: {
    selectableTimestampingServices(): TimestampingService[] {
      return [...this.approvedTimestampingServices].filter(
        (approvedService) =>
          !this.configuredTimestampingServices.some(
            (configuredService) =>
              approvedService.name === configuredService.name,
          ),
      );
    },
    selectedTimestampingService(): TimestampingService | undefined {
      return this.approvedTimestampingServices.find(
        (approvedService) =>
          approvedService.name === this.selectedTimestampingServiceName,
      );
    },
  },
  methods: {
    fetchApprovedTimestampingServices(): void {
      api
        .get<TimestampingService[]>('/timestamping-services')
        .then((resp) => (this.approvedTimestampingServices = resp.data))
        .catch((error) => this.$store.dispatch('showError', error));
    },
    add(): void {
      this.loading = true;
      api
        .post('/system/timestamping-services', this.selectedTimestampingService)
        .then(() => {
          this.$emit('added');
          this.loading = false;
          this.close();
          this.$store.dispatch(
            'showSuccess',
            'systemParameters.timestampingServices.action.add.dialog.success',
          );
        })
        .catch((error) => this.$store.dispatch('showError', error));
    },
    close(): void {
      this.show = false;
      this.selectedTimestampingServiceName = '';
    },
  },
  created(): void {
    this.fetchApprovedTimestampingServices();
  },
});
</script>

<style scoped lang="scss">
@import '../../../assets/dialogs';
@import '../../../assets/colors';
.option-row {
  border-bottom: solid 1px $XRoad-Grey10;
}

.content-wrapper {
  color: #000000 !important;
}

.v-label {
  color: $XRoad-Black !important;
}
</style>
