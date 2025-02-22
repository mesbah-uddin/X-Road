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
  <div class="xrd-tab-max-width main-wrap">
    <div class="pa-4">
      <xrd-sub-view-title :title="groupCode" @close="close" />

      <template>
        <div class="cert-hash" data-test="local-group-title">
          {{ $t('localGroup.localGroup') }}
          <xrd-button
            v-if="showDelete"
            @click="deleteGroup()"
            outlined
            data-test="delete-local-group-button"
          >
            {{ $t('action.delete') }}
          </xrd-button>
        </div>
      </template>
    </div>

    <div class="px-4 description-field">
      <template v-if="canEditDescription">
        <v-text-field
          v-model="description"
          @change="saveDescription"
          outlined
          :label="$t('localGroup.description')"
          hide-details
          data-test="ocal-group-edit-description-input"
          class="description-input"
        ></v-text-field>
      </template>
      <template v-else>
        <div>{{ description }}</div>
      </template>
    </div>

    <div class="group-members-row px-4">
      <div class="row-title">{{ $t('localGroup.groupMembers') }}</div>
      <div class="row-buttons">
        <xrd-button
          :disabled="!hasMembers"
          v-if="canEditMembers"
          @click="removeAllMembers()"
          outlined
          data-test="remove-all-members-button"
          >{{ $t('action.removeAll') }}</xrd-button
        >

        <xrd-button
          class="add-members-button"
          v-if="canEditMembers"
          @click="addMembers()"
          outlined
          data-test="add-members-button"
          >{{ $t('localGroup.addMembers') }}</xrd-button
        >
      </div>
    </div>

    <v-card flat>
      <table class="xrd-table group-members-table">
        <tr>
          <th>{{ $t('localGroup.name') }}</th>
          <th>{{ $t('localGroup.id') }}</th>
          <th>{{ $t('localGroup.accessDate') }}</th>
          <th></th>
        </tr>
        <template v-if="group && group.members && group.members.length > 0">
          <tr v-for="groupMember in group.members" v-bind:key="groupMember.id">
            <td>{{ groupMember.name }}</td>
            <td>{{ groupMember.id }}</td>
            <td>{{ groupMember.created_at }}</td>

            <td>
              <div class="button-wrap">
                <xrd-button
                  v-if="canEditMembers"
                  text
                  :outlined="false"
                  @click="removeMember(groupMember)"
                  >{{ $t('action.remove') }}</xrd-button
                >
              </div>
            </td>
          </tr>
        </template>
      </table>

      <div class="close-button-wrap">
        <xrd-button @click="close()" data-test="local-group-close-button">{{
          $t('action.close')
        }}</xrd-button>
      </div>
    </v-card>

    <!-- Confirm dialog delete group -->
    <xrd-confirm-dialog
      :dialog="confirmGroup"
      title="localGroup.deleteTitle"
      text="localGroup.deleteText"
      @cancel="confirmGroup = false"
      @accept="doDeleteGroup()"
    />

    <!-- Confirm dialog remove member -->
    <xrd-confirm-dialog
      :dialog="confirmMember"
      title="localGroup.removeTitle"
      text="localGroup.removeText"
      @cancel="confirmMember = false"
      @accept="doRemoveMember()"
    />

    <!-- Confirm dialog remove all members -->
    <xrd-confirm-dialog
      :dialog="confirmAllMembers"
      title="localGroup.removeAllTitle"
      text="localGroup.removeAllText"
      @cancel="confirmAllMembers = false"
      @accept="doRemoveAllMembers()"
    />

    <!-- Add new members dialog -->
    <addMembersDialog
      v-if="group"
      :dialog="addMembersDialogVisible"
      :filtered="group.members"
      @cancel="closeMembersDialog"
      @members-added="doAddMembers"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Permissions } from '@/global';
import { GroupMember, LocalGroup } from '@/openapi-types';
import AddMembersDialog from './AddMembersDialog.vue';
import * as api from '@/util/api';
import { encodePathParameter } from '@/util/api';

export default Vue.extend({
  components: {
    AddMembersDialog,
  },
  props: {
    clientId: {
      type: String,
      required: true,
    },
    groupId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      confirmGroup: false,
      confirmMember: false,
      confirmAllMembers: false,
      selectedMember: undefined as GroupMember | undefined,
      description: undefined as string | undefined,
      group: undefined as LocalGroup | undefined,
      groupCode: '',
      addMembersDialogVisible: false,
    };
  },
  computed: {
    showDelete(): boolean {
      return this.$store.getters.hasPermission(Permissions.DELETE_LOCAL_GROUP);
    },
    canEditDescription(): boolean {
      return this.$store.getters.hasPermission(
        Permissions.EDIT_LOCAL_GROUP_DESC,
      );
    },

    canEditMembers(): boolean {
      return this.$store.getters.hasPermission(
        Permissions.EDIT_LOCAL_GROUP_MEMBERS,
      );
    },

    hasMembers(): boolean {
      if (this.group && this.group.members && this.group.members.length > 0) {
        return true;
      }
      return false;
    },
  },
  methods: {
    close(): void {
      this.$router.go(-1);
    },

    saveDescription(): void {
      api
        .patch<LocalGroup>(
          `/local-groups/${encodePathParameter(this.groupId)}`,
          {
            description: this.description,
          },
        )
        .then((res) => {
          this.$store.dispatch('showSuccess', 'localGroup.descSaved');
          this.group = res.data;
          this.groupCode = res.data.code;
          this.description = res.data.description;
        })
        .catch((error) => {
          this.$store.dispatch('showError', error);
        });
    },

    fetchData(clientId: string, groupId: number | string): void {
      api
        .get<LocalGroup>(`/local-groups/${encodePathParameter(groupId)}`)
        .then((res) => {
          this.group = res.data;
          this.groupCode = res.data.code;
          this.description = res.data.description;
        })
        .catch((error) => {
          this.$store.dispatch('showError', error);
        });
    },

    addMembers(): void {
      this.addMembersDialogVisible = true;
    },

    doAddMembers(selectedIds: string[]): void {
      this.addMembersDialogVisible = false;

      api
        .post(`/local-groups/${encodePathParameter(this.groupId)}/members`, {
          items: selectedIds,
        })
        .then(() => {
          this.fetchData(this.clientId, this.groupId);
        })
        .catch((error) => {
          this.$store.dispatch('showError', error);
        });
    },

    closeMembersDialog(): void {
      this.addMembersDialogVisible = false;
    },

    removeAllMembers(): void {
      this.confirmAllMembers = true;
    },

    doRemoveAllMembers(): void {
      if (!this.group?.members) {
        return;
      }
      const ids: string[] = [];

      this.group.members.forEach((member: GroupMember) => {
        ids.push(member.id);
      });
      this.removeArrayOfMembers(ids);

      this.confirmAllMembers = false;
    },

    removeMember(member: GroupMember): void {
      this.confirmMember = true;
      this.selectedMember = member as GroupMember;
    },
    doRemoveMember() {
      if (!this.selectedMember) {
        return;
      }
      const member: GroupMember = this.selectedMember;

      if (member && member.id) {
        this.removeArrayOfMembers([member.id]);
      }

      this.confirmMember = false;
      this.selectedMember = undefined;
    },

    removeArrayOfMembers(members: string[]) {
      api
        .post(
          `/local-groups/${encodePathParameter(this.groupId)}/members/delete`,
          {
            items: members,
          },
        )
        .catch((error) => {
          this.$store.dispatch('showError', error);
        })
        .finally(() => {
          this.fetchData(this.clientId, this.groupId);
        });
    },

    deleteGroup(): void {
      this.confirmGroup = true;
    },
    doDeleteGroup(): void {
      this.confirmGroup = false;

      api
        .remove(`/local-groups/${encodePathParameter(this.groupId)}`)
        .then(() => {
          this.$store.dispatch('showSuccess', 'localGroup.groupDeleted');
          this.$router.go(-1);
        })
        .catch((error) => {
          this.$store.dispatch('showError', error);
        });
    },
  },
  created() {
    this.fetchData(this.clientId, this.groupId);
  },
});
</script>

<style lang="scss" scoped>
@import '~styles/tables';

.main-wrap {
  background-color: white;
  margin-top: 20px;
  border-radius: 4px;
  box-shadow: $XRoad-DefaultShadow;
  font-size: $XRoad-DefaultFontSize;
}

.edit-row {
  display: flex;
  align-content: center;
  align-items: baseline;
  margin-top: 30px;

  .description-input {
    margin-left: 60px;
  }
}

.group-members-row {
  width: 100%;
  display: flex;
  margin-top: 70px;
  align-items: baseline;
}
.row-title {
  width: 100%;
  justify-content: space-between;
  color: $XRoad-Black100;
  font-size: 20px;
  font-weight: 500;
  letter-spacing: 0.5px;
}
.row-buttons {
  display: flex;
}

.cert-hash {
  margin-top: 50px;
  display: flex;
  justify-content: space-between;
  color: $XRoad-Black100;
  font-size: 20px;
  font-weight: 500;
  letter-spacing: 0.5px;
  line-height: 30px;
}

.group-members-table {
  margin-top: 10px;
}

.add-members-button {
  margin-left: 20px;
}

.button-wrap {
  width: 100%;
  display: flex;
  justify-content: flex-end;
}

.close-button-wrap {
  margin-top: 48px;
  display: flex;
  justify-content: flex-end;
  padding: 20px;
  background-color: $XRoad-WarmGrey10;
  height: 72px;
}

.description-field {
  width: 404px;
  margin-top: 20px;
}
</style>
