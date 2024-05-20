<template>
  <div>
    <cr-table type="bordered" class="pb-12">
      <thead>
        <tr>
          <cr-table-head v-model="sort" property="displayName" :sticky="true">
            ORGANIZATION
          </cr-table-head>
          <cr-table-head>
            ASSOCIATED PROJECT GROUPS
          </cr-table-head>
          <cr-table-head>
            IDENTITIES
          </cr-table-head>
          <cr-table-head :sticky="true" />
        </tr>
      </thead>

      <tbody>
        <tr v-for="(org, oi) of props.organizations" :key="org.id">
          <cr-table-cell :sticky="true">
            <app-organization-name
              class="w-full"
              :organization="org"
            />
          </cr-table-cell>
          <cr-table-cell>
            <div class="flex">
              <el-popover placement="top-start">
                <template #reference>
                  <div class="border border-gray-300 h-6 px-2 rounded-md bg-white text-sm whitespace-nowrap">
                    {{ org.segments.length }} project group{{ org.segments.length !== 1 ? 's' : '' }}
                  </div>
                </template>

                <div>
                  <div class="mb-2 text-gray-400 text-2xs">
                    Project groups
                  </div>
                  <div class="flex flex-wrap items-center gap-1">
                    <div v-for="segmentId of org.segments" :key="segmentId">
                      <el-tag type="info" size="small">
                        {{ getSegmentName(segmentId) }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </el-popover>
            </div>
          </cr-table-cell>
          <cr-table-cell>
            <div class="h-full flex items-center">
              <app-identities-horizontal-list-organizations
                :organization="org"
                :limit="5"
              />
            </div>
          </cr-table-cell>
          <cr-table-cell :sticky="true" :style="{ 'z-index': props.organizations.length - oi + 2 }">
            <div class="flex justify-end">
              <cr-dropdown placement="bottom-end">
                <template #trigger>
                  <cr-button type="tertiary-gray" :icon-only="true" size="small">
                    <i class="ri-more-fill !text-lg" />
                  </cr-button>
                </template>
                <cr-dropdown-item @click="isMergeDialogOpen = org">
                  <i class="ri-link-m" />
                  Merge organization
                </cr-dropdown-item>
                <cr-dropdown-item
                  v-if="!org.isTeamOrganization"
                  @click="markAsTeamOrganization(org)"
                >
                  <i class="ri-team-line" />
                  Mark as team organization
                </cr-dropdown-item>
                <cr-dropdown-separator />
                <cr-dropdown-item type="danger" @click="deleteOrganization(org)">
                  <i class="ri-delete-bin-6-line" />
                  Delete organization
                </cr-dropdown-item>
              </cr-dropdown>
            </div>
          </cr-table-cell>
        </tr>
      </tbody>

      <tfoot class="border-b border-gray-100" style="z-index: 0">
        <tr>
          <cr-table-cell :sticky="true" colspan="2" style="z-index: 0">
            <slot name="pagination" />
          </cr-table-cell>
        </tr>
      </tfoot>
      <div class="absolute bottom-0 left-0 right-0 bg-white h-12" />
    </cr-table>
  </div>

  <app-organization-merge-dialog v-model="isMergeDialogOpen" />
</template>

<script setup lang="ts">
import CrTable from '@/ui-kit/table/Table.vue';
import CrTableHead from '@/ui-kit/table/TableHead.vue';
import AppOrganizationName from '@/modules/organization/components/organization-name.vue';
import AppIdentitiesHorizontalListOrganizations
  from '@/shared/modules/identities/components/identities-horizontal-list-organizations.vue';
import CrDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import CrButton from '@/ui-kit/button/Button.vue';
import CrDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import CrDropdownSeparator from '@/ui-kit/dropdown/DropdownSeparator.vue';
import CrTableCell from '@/ui-kit/table/TableCell.vue';
import AppOrganizationMergeDialog from '@/modules/organization/components/organization-merge-dialog.vue';
import { computed, ref } from 'vue';
import { OrganizationService } from '@/modules/organization/organization-service';
import Message from '@/shared/message/message';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import { i18n } from '@/i18n';
import { getSegmentName } from '../../../../utils/segments';

const props = defineProps<{
  sorting: string,
  organizations: any[]
}>();

const emit = defineEmits<{(e: 'reload'): void, (e: 'update:sorting', value: string): void}>();

const sort = computed<string>({
  get() {
    return props.sorting;
  },
  set(val: string) {
    emit('update:sorting', val);
  },
});

const isMergeDialogOpen = ref<any>(null);

const markAsTeamOrganization = (organization: any) => {
  Message.info(null, {
    title: 'Organization is being updated',
  });
  OrganizationService.update(organization.id, {
    isTeamOrganization: true,
  }, organization.segments)
    .then(() => {
      Message.closeAll();
      Message.success('Organization updated successfully');
      emit('reload');
    })
    .catch(() => {
      Message.closeAll();
      Message.error('Something went wrong');
    });
};
const deleteOrganization = (organization: any) => {
  ConfirmDialog({
    type: 'danger',
    title: 'Delete organization',
    message: "Are you sure you want to proceed? You can't undo this action",
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel',
    icon: 'ri-delete-bin-line',
  }).then(() => {
    Message.info(null, {
      title: 'Organization is being deleted',
    });
    OrganizationService.destroyAll([organization.id])
      .then(() => {
        Message.closeAll();
        Message.success(i18n('entities.organization.destroy.success'));
        emit('reload');
      })
      .catch(() => {
        Message.closeAll();
        Message.error('Something went wrong');
      });
  });
};
</script>

<script lang="ts">
export default {
  name: 'AppOrganizationListTable',
};
</script>
