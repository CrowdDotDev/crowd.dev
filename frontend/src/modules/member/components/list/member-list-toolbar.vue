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
          Merge members
        </el-dropdown-item>
        <el-tooltip
          placement="top"
          content="Selected members lack an associated GitHub profile or Email"
          :disabled="
            elegibleEnrichmentMembersIds.length
              || isEditLockedForSampleData
          "
          popper-class="max-w-[260px]"
        >
          <span>
            <el-dropdown-item
              :command="{ action: 'enrichMember' }"
              :disabled="
                !elegibleEnrichmentMembersIds.length
                  || isEditLockedForSampleData
              "
              class="mb-1"
            >
              <app-svg
                name="enrichment"
                class="max-w-[16px] h-4"
                color="#9CA3AF"
              />
              <span class="ml-2">{{
                enrichmentLabel
              }}</span>
            </el-dropdown-item>
          </span>
        </el-tooltip>
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

    <app-tag-popover v-model="bulkTagsUpdateVisible"
      @reload="fetchMembers({ reload: true })" />

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
import {
  checkEnrichmentLimit,
  checkEnrichmentPlan,
  getEnrichmentMax,
  showEnrichmentLoadingMessage,
} from '@/modules/member/member-enrichment';
import AppTagPopover from '@/modules/tag/components/tag-popover.vue';
import AppSvg from '@/shared/svg/svg.vue';

const { currentUser, currentTenant } = mapGetters('auth');
const { doRefreshCurrentUser } = mapActions('auth');
const memberStore = useMemberStore();
const { selectedMembers, filters } = storeToRefs(memberStore);
const { fetchMembers, getMemberCustomAttributes } = memberStore;

const bulkTagsUpdateVisible = ref(false);

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

const elegibleEnrichmentMembersIds = computed(() => selectedMembers.value
  .filter(
    (r) => r.username?.github?.length || r.emails?.length,
  )
  .map((item) => item.id));

const enrichedMembers = computed(() => selectedMembers.value.filter((r) => r.lastEnriched)
  .length);

const enrichmentLabel = computed(() => {
  if (
    enrichedMembers.value
    && enrichedMembers.value
    === elegibleEnrichmentMembersIds.value.length
  ) {
    return `Re-enrich ${pluralize(
      'member',
      selectedIds.value.length,
      false,
    )}`;
  }

  return `Enrich ${pluralize(
    'member',
    selectedIds.value.length,
    false,
  )}`;
});

const selectedIds = computed(() => selectedMembers.value.map((item) => item.id));

const markAsTeamMemberOptions = computed(() => {
  const isTeamView = filters.value.settings.teamMember === 'filter';
  const membersCopy = pluralize(
    'member',
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

const handleMergeMembers = () => {
  const [firstMember, secondMember] = selectedMembers.value;
  return MemberService.merge(firstMember, secondMember)
    .then(() => {
      Message.success('Members merged successfuly');
      fetchMembers({ reload: true });
    })
    .catch(() => {
      Message.error('Error merging members');
    });
};

const doDestroyAllWithConfirm = () => ConfirmDialog({
  type: 'danger',
  title: 'Delete members',
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
      badgeContent: pluralize('member', selectedMembers.value.length, true),
    });

    await MemberService.export({
      filter,
      orderBy: `${filters.value.order.prop}_${filters.value.order.order === 'descending' ? 'DESC' : 'ASC'}`,
      limit: 0,
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

const handleAddTags = async () => {
  bulkTagsUpdateVisible.value = true;
};

const doMarkAsTeamMember = (value) => {
  Promise.all(selectedMembers.value.map((member) => MemberService.update(member.id, {
    attributes: {
      ...member.attributes,
      isTeamMember: {
        default: value,
      },
    },
  })))
    .then(() => {
      fetchMembers({ reload: true });
      Message.success(
        `Member${
          selectedMembers.value.length > 1 ? 's' : ''
        } updated successfully`,
      );
    });
};

const handleCommand = async (command) => {
  if (command.action === 'markAsTeamMember') {
    await doMarkAsTeamMember(command.value);
  } else if (command.action === 'export') {
    await handleDoExport();
  } else if (command.action === 'mergeMembers') {
    await handleMergeMembers();
  } else if (command.action === 'editTags') {
    await handleAddTags();
  } else if (command.action === 'destroyAll') {
    await doDestroyAllWithConfirm();
  } else if (command.action === 'enrichMember') {
    const enrichments = elegibleEnrichmentMembersIds.value.length;
    let doEnrich = false;
    let reEnrichmentMessage = null;

    if (enrichedMembers.value) {
      reEnrichmentMessage = enrichedMembers.value === 1
        ? 'You selected 1 member that was already enriched. If you proceed, this member will be re-enriched and counted towards your quota.'
        : `You selected ${enrichedMembers.value} members that were already enriched. If you proceed,
            these members will be re-enriched and counted towards your quota.`;
    }

    // All members are elegible for enrichment
    if (enrichments === selectedIds.value.length) {
      if (!enrichedMembers.value) {
        doEnrich = true;
      } else {
        try {
          await ConfirmDialog({
            type: 'warning',
            title: 'Some members were already enriched',
            message: reEnrichmentMessage,
            confirmButtonText: `Proceed with enrichment (${pluralize(
              'member',
              enrichments,
              true,
            )})`,
            cancelButtonText: 'Cancel',
            icon: 'ri-alert-line',
          });

          doEnrich = true;
        } catch (error) {
          console.error(error);
        }
      }
    } else {
      try {
        await ConfirmDialog({
          type: 'warning',
          title:
            'Some members lack an associated GitHub profile or Email',
          message:
            'Member enrichment requires an associated GitHub profile or Email. If you proceed, only the members who fulfill '
            + 'this requirement will be enriched and counted towards your quota.',
          confirmButtonText: `Proceed with enrichment (${pluralize(
            'member',
            enrichments,
            true,
          )})`,
          highlightedInfo: reEnrichmentMessage,
          cancelButtonText: 'Cancel',
          icon: 'ri-alert-line',
        });

        doEnrich = true;
      } catch (error) {
        console.error(error);
      }
    }

    if (doEnrich) {
      const { memberEnrichmentCount } = currentTenant.value;
      const planEnrichmentCountMax = getEnrichmentMax(
        currentTenant.value.plan,
      );

      // Check if it is trying to enrich more members than
      // the number available for the current tenant plan
      if (
        checkEnrichmentPlan({
          enrichmentCount:
            memberEnrichmentCount + elegibleEnrichmentMembersIds.value.length,
          planEnrichmentCountMax,
        })
      ) {
        return;
      }

      // Check if it has reached enrichment maximum
      // If so, show dialog to upgrade plan
      if (checkEnrichmentLimit(planEnrichmentCountMax)) {
        return;
      }

      // Show enrichment loading message
      showEnrichmentLoadingMessage({ isBulk: true });

      await MemberService.enrichMemberBulk(elegibleEnrichmentMembersIds.value);
      fetchMembers({ reload: true });

      await getMemberCustomAttributes();
    }
  }
};
</script>

<script>
export default {
  name: 'AppMemberListToolbar',
};
</script>
