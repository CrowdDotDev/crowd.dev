<template>
  <div
    v-if="selectedMembers.length > 0"
    class="app-list-table-bulk-actions"
  >
    <span class="block text-sm font-semibold mr-4">
      {{ pluralize('member', selectedMembers.length, true) }}
      selected</span>
    <el-dropdown trigger="click" @command="handleCommand">
      <button type="button" class="btn btn--bordered btn--sm">
        <span class="mr-2">Actions</span>
        <i class="ri-xl ri-arrow-down-s-line" />
      </button>
      <template #dropdown>
        <el-dropdown-item :command="{ action: 'export' }">
          <i class="ri-lg ri-file-download-line mr-1" />
          Export to CSV
        </el-dropdown-item>
        <el-dropdown-item
          v-if="selectedMembers.length === 2"
          :command="{ action: 'mergeMembers' }"
          :disabled="isEditLockedForSampleData"
        >
          <i class="ri-lg ri-group-line mr-1" />
          Merge contacts
        </el-dropdown-item>
        <el-dropdown-item
          :command="{
            action: 'markAsTeamMember',
            value: markAsTeamMemberOptions.value,
          }"
          :disabled="
            isReadOnly || isEditLockedForSampleData
          "
        >
          <i
            class="ri-lg mr-1"
            :class="markAsTeamMemberOptions.icon"
          />
          {{ markAsTeamMemberOptions.copy }}
        </el-dropdown-item>
        <el-dropdown-item
          :command="{ action: 'editAttribute' }"
          :disabled="isEditLockedForSampleData"
        >
          <i class="ri-lg ri-file-edit-line mr-1" />
          Edit attribute
        </el-dropdown-item>
        <el-dropdown-item
          :command="{ action: 'editTags' }"
          :disabled="isEditLockedForSampleData"
        >
          <i class="ri-lg ri-price-tag-3-line mr-1" />
          Edit tags
        </el-dropdown-item>
        <hr class="border-gray-200 my-1 mx-2" />
        <el-dropdown-item
          :command="{ action: 'destroyAll' }"
          :disabled="
            isReadOnly || isDeleteLockedForSampleData
          "
        >
          <div
            class="flex items-center"
            :class="{
              'text-red-500': !isDeleteLockedForSampleData,
            }"
          >
            <i class="ri-lg ri-delete-bin-line mr-2" />
            <app-i18n code="common.destroy" />
          </div>
        </el-dropdown-item>
      </template>
    </el-dropdown>

    <app-tag-popover
      v-model="bulkTagsUpdateVisible"
      @reload="fetchMembers({ reload: true })"
    />

    <app-bulk-edit-attribute-popover
      v-model="bulkAttributesUpdateVisible"
      @reload="fetchMembers({ reload: true })"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { MemberPermissions } from '@/modules/member/member-permissions';
import { useMemberStore } from '@/modules/member/store/pinia';
import { storeToRefs } from 'pinia';
import { mapActions, mapGetters } from '@/shared/vuex/vuex.helpers';
import { MemberService } from '@/modules/member/member-service';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import Message from '@/shared/message/message';
import pluralize from 'pluralize';
import { getExportMax, showExportDialog, showExportLimitDialog } from '@/modules/member/member-export-limit';
import AppBulkEditAttributePopover from '@/modules/member/components/bulk/bulk-edit-attribute-popover.vue';
import AppTagPopover from '@/modules/tag/components/tag-popover.vue';

const { currentUser, currentTenant } = mapGetters('auth');
const { doRefreshCurrentUser } = mapActions('auth');

const memberStore = useMemberStore();
const { selectedMembers, filters } = storeToRefs(memberStore);
const { fetchMembers } = memberStore;

const bulkTagsUpdateVisible = ref(false);
const bulkAttributesUpdateVisible = ref(false);

const isReadOnly = computed(() => (
  new MemberPermissions(
    currentTenant.value,
    currentUser.value,
  ).edit === false
));

const isEditLockedForSampleData = computed(() => (
  new MemberPermissions(
    currentTenant.value,
    currentUser.value,
  ).editLockedForSampleData
));

const isDeleteLockedForSampleData = computed(() => (
  new MemberPermissions(
    currentTenant.value,
    currentUser.value,
  ).destroyLockedForSampleData
));

const markAsTeamMemberOptions = computed(() => {
  const isTeamView = filters.value.settings.teamMember === 'filter';
  const membersCopy = pluralize(
    'contact',
    selectedMembers.value.length,
    false,
  );

  if (isTeamView) {
    return {
      icon: 'ri-bookmark-2-line',
      copy: `Unmark as team ${membersCopy}`,
      value: false,
    };
  }

  return {
    icon: 'ri-bookmark-line',
    copy: `Mark as team ${membersCopy}`,
    value: true,
  };
});

const handleMergeMembers = async () => {
  const [firstMember, secondMember] = selectedMembers.value;
  Message.info(
    null,
    {
      title: 'Contacts are being merged',
    },
  );

  return MemberService.merge(firstMember, secondMember)
    .then(() => {
      Message.closeAll();
      Message.success('Contacts merged successfuly');

      fetchMembers({ reload: true });
    })
    .catch((error) => {
      Message.closeAll();

      if (error.response.status === 404) {
        Message.success('Contacts already merged or deleted', {
          message: `Sorry, the contacts you are trying to merge might have already been merged or deleted.
          Please refresh to see the updated information.`,
        });
      } else {
        Message.error('There was an error merging contacts');
      }
    });
};

const doDestroyAllWithConfirm = () => ConfirmDialog({
  type: 'danger',
  title: 'Delete contacts',
  message:
        "Are you sure you want to proceed? You can't undo this action",
  confirmButtonText: 'Confirm',
  cancelButtonText: 'Cancel',
  icon: 'ri-delete-bin-line',
})
  .then(() => {
    const ids = selectedMembers.value.map((m) => m.id);
    return MemberService.destroyAll(ids);
  })
  .then(() => fetchMembers({ reload: true }));

const handleDoExport = async () => {
  const ids = selectedMembers.value.map((i) => i.id);

  const filter = {
    id: {
      in: ids,
    },
  };

  try {
    const tenantCsvExportCount = currentTenant.value.csvExportCount;
    const planExportCountMax = getExportMax(
      currentTenant.value.plan,
    );

    await showExportDialog({
      tenantCsvExportCount,
      planExportCountMax,
      badgeContent: pluralize('contact', selectedMembers.value.length, true),
    });

    await MemberService.export({
      filter,
      orderBy: `${filters.value.order.prop}_${filters.value.order.order === 'descending' ? 'DESC' : 'ASC'}`,
      limit: ids.length || 0,
      offset: null,
    });

    await doRefreshCurrentUser(null);

    Message.success(
      'CSV download link will be sent to your e-mail',
    );
  } catch (error) {
    console.error(error);

    if (error.response?.status === 403) {
      const planExportCountMax = getExportMax(
        currentTenant.value.plan,
      );

      showExportLimitDialog({ planExportCountMax });
    } else if (error !== 'cancel') {
      Message.error(
        'An error has occured while trying to export the CSV file. Please try again',
        {
          title: 'CSV Export failed',
        },
      );
    }
  }
};

const handleEditAttribute = async () => {
  bulkAttributesUpdateVisible.value = true;
};

const handleAddTags = async () => {
  bulkTagsUpdateVisible.value = true;
};

const doMarkAsTeamMember = async (value) => {
  Message.info(
    null,
    {
      title: 'Contacts are being updated',
    },
  );

  return Promise.all(selectedMembers.value.map((member) => MemberService.update(member.id, {
    attributes: {
      ...member.attributes,
      isTeamMember: {
        default: value,
      },
    },
  })))
    .then(() => {
      Message.closeAll();
      Message.success(
        `Contact${
          selectedMembers.value.length > 1 ? 's' : ''
        } updated successfully`,
      );

      fetchMembers({ reload: true });
    })
    .catch(() => {
      Message.closeAll();
      Message.error('Error updating contacts');
    });
};

const handleCommand = async (command) => {
  if (command.action === 'markAsTeamMember') {
    await doMarkAsTeamMember(command.value);
  } else if (command.action === 'export') {
    await handleDoExport();
  } else if (command.action === 'mergeMembers') {
    await handleMergeMembers();
  } else if (command.action === 'editAttribute') {
    await handleEditAttribute();
  } else if (command.action === 'editTags') {
    await handleAddTags();
  } else if (command.action === 'destroyAll') {
    await doDestroyAllWithConfirm();
  }
};
</script>

<script>
export default {
  name: 'AppMemberListToolbar',
};
</script>
