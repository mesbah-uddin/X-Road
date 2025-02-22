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
  <thead>
    <tr>
      <th
        class="title-col"
        @click="setSort(sortColumn.NAME)"
        @mouseover="hoverName = true"
        @mouseleave="hoverName = false"
        data-test="name-sort"
      >
        <div class="header-title">
          <div>{{ $t('name') }}</div>
          <sort-button
            :arrowState="sortDirection"
            :active="hoverName"
            :selected="selectedSort === sortColumn.NAME"
          />
        </div>
      </th>
      <th
        class="id-col"
        @click="setSort(sortColumn.ID)"
        @mouseover="hoverId = true"
        @mouseleave="hoverId = false"
        data-test="id-sort"
      >
        <div class="header-title">
          {{ $t('keys.id') }}
          <sort-button
            :arrowState="sortDirection"
            :active="hoverId"
            :selected="selectedSort === sortColumn.ID"
          />
        </div>
      </th>
      <th
        class="ocsp-col"
        @click="setSort(sortColumn.OCSP)"
        @mouseover="hoverOcsp = true"
        @mouseleave="hoverOcsp = false"
        data-test="ocsp-sort"
      >
        <div class="header-title">
          {{ $t('keys.ocsp') }}
          <sort-button
            :arrowState="sortDirection"
            :active="hoverOcsp"
            :selected="selectedSort === sortColumn.OCSP"
          />
        </div>
      </th>
      <th
        class="expiration-col"
        @click="setSort(sortColumn.EXPIRATION)"
        @mouseover="hoverExp = true"
        @mouseleave="hoverExp = false"
        data-test="expiration-sort"
      >
        <div class="header-title">
          {{ $t('keys.expires') }}
          <sort-button
            :arrowState="sortDirection"
            :active="hoverExp"
            :selected="selectedSort === sortColumn.EXPIRATION"
          />
        </div>
      </th>
      <th
        class="status-col"
        @click="setSort(sortColumn.STATUS)"
        @mouseover="hoverStatus = true"
        @mouseleave="hoverStatus = false"
        data-test="status-sort"
      >
        <div class="header-title">
          {{ $t('keys.status') }}
          <sort-button
            :arrowState="sortDirection"
            :active="hoverStatus"
            :selected="selectedSort === sortColumn.STATUS"
          />
        </div>
      </th>
      <th class="action-col"></th>
    </tr>
  </thead>
</template>

<script lang="ts">
/**
 * Table component for an array of keys
 */
import Vue from 'vue';
import SortButton from './SortButton.vue';
import { Colors } from '@/global';
import { KeysSortColumn } from './keyColumnSorting';

export default Vue.extend({
  components: {
    SortButton,
  },
  props: {
    sortDirection: {
      type: Boolean,
      required: true,
    },
    selectedSort: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      colors: Colors,
      titleSort: false,
      sortColumn: KeysSortColumn,
      hoverName: false,
      hoverId: false,
      hoverOcsp: false,
      hoverExp: false,
      hoverStatus: false,
    };
  },
  methods: {
    setSort(sort: KeysSortColumn): void {
      this.$emit('set-sort', sort);
    },
  },
});
</script>

<style lang="scss" scoped>
@import '~styles/tables';

.xrd-table {
  .title-col {
    width: 30%;
    cursor: pointer;
    user-select: none;
    padding-left: 40px;
  }
}

.id-col {
  cursor: pointer;
  user-select: none;
}

.ocsp-col,
.expiration-col,
.status-col,
.action-col {
  width: 10%;
  font-weight: 700;
  color: $XRoad-Black100;
  cursor: pointer;
  user-select: none;
}

.header-title {
  font-size: 12px;
  display: flex;
  flex-direction: row;
  align-items: center;
  font-weight: 700;
  color: $XRoad-Black100;
}
</style>
