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
  <v-card flat class="pb-3">
    <table class="xrd-table">
      <thead>
        <tr>
          <th>{{ $t('name') }}</th>
          <th></th>
        </tr>
      </thead>
      <template v-if="backups && backups.length > 0">
        <tbody>
          <tr v-for="backup in filtered()" v-bind:key="backup.filename">
            <td>{{ backup.filename }}</td>
            <td>
              <div class="d-flex justify-end">
                <xrd-button
                  v-if="canBackup"
                  :min_width="50"
                  text
                  :outlined="false"
                  class="xrd-table-button"
                  data-test="backup-download"
                  @click="downloadBackup(backup.filename)"
                  >{{ $t('action.download') }}
                </xrd-button>
                <restore-backup-button
                  v-if="canRestore"
                  :backup="backup"
                  @restored="refreshData"
                />
                <delete-backup-button
                  :can-backup="canBackup"
                  :backup="backup"
                  @deleted="refreshData"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </template>
    </table>
  </v-card>
</template>

<script lang="ts">
import Vue from 'vue';
import * as api from '@/util/api';
import { Backup } from '@/openapi-types';
import { saveResponseAsFile, selectedFilter } from '@/util/helpers';
import DeleteBackupButton from '@/views/Settings/BackupAndRestore/DeleteBackupButton.vue';
import { Prop } from 'vue/types/options';
import RestoreBackupButton from '@/views/Settings/BackupAndRestore/RestoreBackupButton.vue';
import { encodePathParameter } from '@/util/api';
import { Permissions } from '@/global';

export default Vue.extend({
  components: {
    DeleteBackupButton,
    RestoreBackupButton,
  },
  props: {
    filter: {
      type: String,
      default: '',
    },
    canBackup: {
      type: Boolean,
      default: false,
      required: true,
    },
    backups: {
      type: Array as Prop<Backup[]>,
      required: true,
    },
  },
  computed: {
    canRestore(): boolean {
      return this.$store.getters.hasPermission(
        Permissions.RESTORE_CONFIGURATION,
      );
    },
  },
  methods: {
    filtered(): Backup[] {
      return selectedFilter(this.backups, this.filter, 'created_at');
    },
    async downloadBackup(fileName: string) {
      api
        .get(`/backups/${encodePathParameter(fileName)}/download`, {
          responseType: 'blob',
        })
        .then((resp) => saveResponseAsFile(resp, fileName))
        .catch((error) => this.$store.dispatch('showError', error));
    },
    refreshData(): void {
      this.$emit('refresh-data');
    },
  },
});
</script>

<style lang="scss" scoped>
@import '~styles/colors';
@import '~styles/tables';
</style>
