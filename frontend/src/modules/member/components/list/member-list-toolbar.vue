<template>
  <div
    v-if="selectedMembers.length > 0"
    class="app-list-table-bulk-actions"
  >
    <span class="block text-sm font-semibold mr-4">
      {{ pluralize('person', selectedMembers.length, true) }}
      selected</span>
    <el-dropdown trigger="click" @command="handleCommand">
      <button type="button" class="btn btn--secondary btn--sm">
        <span class="mr-2">Actions</span>
        <lf-icon name="chevron-down" :size="24" />
      </button>
      <template #dropdown>
        <el-dropdown-item :command="{ action: 'export' }">
          <lf-icon name="file-arrow-down" :size="20" class="mr-1" />
          Export to CSV
        </el-dropdown-item>
        <el-tooltip
          v-if="selectedMembers.length === 2 && hasPermission(LfPermission.mergeMembers)"
          content="Coming soon"
          placement="top"
        >
          <span>
            <el-dropdown-item
              :command="{ action: 'mergeMembers' }"
              :disabled="!hasPermission(LfPermission.mergeMembers)"
            >
              <lf-icon name="user-group" :size="20" class="mr-1" />
              Merge profile
            </el-dropdown-item>
          </span>
        </el-tooltip>
        <el-dropdown-item
          v-if="hasPermission(LfPermission.memberEdit)"
          :command="{
            action: 'markAsTeamMember',
            value: markAsTeamMemberOptions.value,
          }"
        >
          <lf-icon :name="markAsTeamMemberOptions.icon" :size="20" class="mr-1" />
          {{ markAsTeamMemberOptions.copy }}
        </el-dropdown-item>
        <el-dropdown-item
          v-if="hasPermission(LfPermission.memberEdit)"
          :command="{ action: 'editAttribute' }"
        >
          <lf-icon name="file-pen" :size="20" class="mr-1" />
          Edit attribute
        </el-dropdown-item>
        <el-dropdown-item
          v-if="hasPermission(LfPermission.tagEdit)"
          :command="{ action: 'editTags' }"
        >
          <lf-icon name="tag fa-rotated-90" :size="20" class="mr-1" />
          Edit tags
        </el-dropdown-item>
        <template v-if="hasPermission(LfPermission.memberDestroy)">
          <hr class="border-gray-200 my-1 mx-2" />
          <el-dropdown-item
            :command="{ action: 'destroyAll' }"
          >
            <div
              class="flex items-center text-red-500"
            >
              <lf-icon name="trash-can" :size="20" class="mr-2" />
              Delete
            </div>
          </el-dropdown-item>
        </template>
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
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import pluralize from 'pluralize';
import { useMemberStore } from '@/modules/member/store/pinia';
import { MemberService } from '@/modules/member/member-service';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import Message from '@/shared/message/message';
import { showExportDialog } from '@/modules/member/member-export-limit';
import AppBulkEditAttributePopover from '@/modules/member/components/bulk/bulk-edit-attribute-popover.vue';
import AppTagPopover from '@/modules/tag/components/tag-popover.vue';
import useMemberMergeMessage from '@/shared/modules/merge/config/useMemberMergeMessage';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const { trackEvent } = useProductTracking();

const route = useRoute();

const authStore = useAuthStore();
const { getUser } = authStore;

const memberStore = useMemberStore();
const { selectedMembers, filters } = storeToRefs(memberStore);
const { fetchMembers } = memberStore;

const { hasPermission } = usePermissions();

const bulkTagsUpdateVisible = ref(false);
const bulkAttributesUpdateVisible = ref(false);

const markAsTeamMemberOptions = computed(() => {
  const isTeamView = filters.value.settings.teamMember === 'filter';
  const membersCopy = pluralize(
    'person',
    selectedMembers.value.length,
    false,
  );

  if (isTeamView) {
    return {
      icon: 'bookmark-slash',
      copy: `Unmark as team ${membersCopy}`,
      value: false,
    };
  }

  return {
    icon: 'bookmark',
    copy: `Mark as team ${membersCopy}`,
    value: true,
  };
});

const handleMergeMembers = async () => {
  const [firstMember, secondMember] = selectedMembers.value;

  const { loadingMessage, apiErrorMessage } = useMemberMergeMessage;

  loadingMessage();

  return MemberService.merge(firstMember, secondMember)
    .then(() => {
      Message.closeAll();
      Message.info(
        "We're finalizing profiles merging. We will let you know once the process is completed.",
        {
          title: 'Profiles merging in progress',
        },
      );
    })
    .catch((error) => {
      apiErrorMessage({ error });
    });
};

const doDestroyAllWithConfirm = () => ConfirmDialog({
  type: 'danger',
  title: 'Delete profile',
  message:
        "Are you sure you want to proceed? You can't undo this action",
  confirmButtonText: 'Confirm',
  cancelButtonText: 'Cancel',
  icon: 'fa-trash-can fa-light',
})
  .then(() => {
    trackEvent({
      key: FeatureEventKey.DELETE_MEMBER,
      type: EventType.FEATURE,
      properties: {
        path: route.path,
        bulk: true,
      },
    });

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
    await showExportDialog({
      badgeContent: pluralize('person', selectedMembers.value.length, true),
    });

    trackEvent({
      key: FeatureEventKey.EXPORT_MEMBERS,
      type: EventType.FEATURE,
      properties: {
        path: route.path,
        bulk: true,
      },
    });

    await MemberService.export({
      filter,
      orderBy: `${filters.value.order.prop}_${filters.value.order.order === 'descending' ? 'DESC' : 'ASC'}`,
      limit: 0,
      offset: null,
    });

    await getUser();

    Message.success(
      'CSV download link will be sent to your e-mail',
    );
  } catch (error) {
    console.error(error);

    if (error !== 'cancel') {
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
      title: 'People are being updated',
    },
  );

  return Promise.all(selectedMembers.value.map((member) => MemberService.update(member.id, {
    attributes: {
      ...member.attributes,
      isTeamMember: {
        default: value,
      },
    },
  }, member.segmentIds)))
    .then(() => {
      Message.closeAll();
      Message.success(`${
        pluralize('Person', selectedMembers.value.length, true)} updated successfully`);

      fetchMembers({ reload: true });
    })
    .catch(() => {
      Message.closeAll();
      Message.error('Error updating people');
    });
};

const handleCommand = async (command) => {
  if (command.action === 'markAsTeamMember') {
    trackEvent({
      key: FeatureEventKey.MARK_AS_TEAM_MEMBER,
      type: EventType.FEATURE,
      properties: {
        path: route.path,
        bulk: true,
      },
    });

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
