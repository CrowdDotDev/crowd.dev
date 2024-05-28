<template>
  <div
    v-if="selectedOrganizations.length > 0"
    class="app-list-table-bulk-actions"
  >
    <span class="block text-sm font-semibold mr-4">
      {{
        pluralize('organization', selectedOrganizations.length, true)
      }}
      selected
    </span>

    <el-dropdown trigger="click" @command="handleCommand">
      <button type="button" class="btn btn--secondary btn--sm">
        <span class="mr-2">Actions</span>
        <i class="ri-xl ri-arrow-down-s-line" />
      </button>
      <template #dropdown>
        <el-dropdown-item :command="{ action: 'export' }">
          <i class="ri-lg ri-file-download-line mr-1" />
          Export to CSV
        </el-dropdown-item>

        <el-tooltip
          v-if="selectedOrganizations.length === 2 && hasPermission(LfPermission.mergeOrganizations)"
          content="Coming soon"
          placement="top"
        >
          <span>
            <el-dropdown-item
              :command="{
                action: 'mergeOrganizations',
              }"
              :disabled="
                !hasPermission(LfPermission.organizationEdit)
                  || !hasPermission(LfPermission.mergeOrganizations)
              "
            >
              <i
                class="ri-lg mr-1 ri-shuffle-line"
              />
              Merge organizations
            </el-dropdown-item>
          </span>
        </el-tooltip>

        <el-dropdown-item
          v-if="markAsTeamOrganizationOptions && hasPermission(LfPermission.organizationEdit)"
          :command="{
            action: 'markAsTeamOrganization',
            value: markAsTeamOrganizationOptions.value,
          }"
        >
          <i
            class="ri-lg mr-1"
            :class="markAsTeamOrganizationOptions.icon"
          />
          {{ markAsTeamOrganizationOptions.copy }}
        </el-dropdown-item>

        <template v-if="hasPermission(LfPermission.organizationDestroy)">
          <hr class="border-gray-200 my-1 mx-2" />

          <el-dropdown-item
            :command="{ action: 'destroyAll' }"
            :disabled="!hasPermission(LfPermission.organizationDestroy)"
          >
            <div
              class="flex items-center text-red-500"
            >
              <i class="ri-lg ri-delete-bin-line mr-2" />
              <span>Delete organizations</span>
            </div>
          </el-dropdown-item>
        </template>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import pluralize from 'pluralize';
import { computed } from 'vue';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import Message from '@/shared/message/message';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import { storeToRefs } from 'pinia';
import { DEFAULT_ORGANIZATION_FILTERS } from '@/modules/organization/store/constants';
import useOrganizationMergeMessage from '@/shared/modules/merge/config/useOrganizationMergeMessage';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { getExportMax } from '@/modules/member/member-export-limit';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import { useRoute } from 'vue-router';
import { OrganizationService } from '../../organization-service';

const { trackEvent } = useProductTracking();

const route = useRoute();

const authStore = useAuthStore();
const { tenant } = storeToRefs(authStore);

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const organizationStore = useOrganizationStore();
const {
  selectedOrganizations,
  filters,
} = storeToRefs(organizationStore);
const { fetchOrganizations } = organizationStore;

const { hasPermission } = usePermissions();

const markAsTeamOrganizationOptions = computed(() => {
  const isTeamView = filters.value.settings.teamOrganization === 'filter';
  const organizationsCopy = pluralize(
    'organization',
    selectedOrganizations.value.length,
    false,
  );

  if (isTeamView) {
    return {
      icon: 'ri-bookmark-2-line',
      copy: `Unmark as team ${organizationsCopy}`,
      value: false,
    };
  }

  return {
    icon: 'ri-bookmark-line',
    copy: `Mark as team ${organizationsCopy}`,
    value: true,
  };
});

const handleDoDestroyAllWithConfirm = () => ConfirmDialog({
  type: 'danger',
  title: 'Delete organizations',
  message:
      "Are you sure you want to proceed? You can't undo this action",
  confirmButtonText: 'Confirm',
  cancelButtonText: 'Cancel',
  icon: 'ri-delete-bin-line',
})
  .then(() => {
    trackEvent({
      key: FeatureEventKey.DELETE_ORGANIZATION,
      type: EventType.FEATURE,
      properties: {
        path: route.path,
        bulk: true,
      },
    });

    const ids = selectedOrganizations.value.map((m) => m.id);
    return OrganizationService.destroyAll(ids);
  })
  .then(() => fetchOrganizations({ reload: true }));

const handleMergeOrganizations = async () => {
  const [firstOrganization, secondOrganization] = selectedOrganizations.value;

  const { loadingMessage, apiErrorMessage } = useOrganizationMergeMessage;

  OrganizationService.mergeOrganizations(firstOrganization.id, secondOrganization.id)
    .then(() => {
      organizationStore
        .addMergedOrganizations(firstOrganization.id, secondOrganization.id);

      loadingMessage();

      fetchOrganizations({ reload: true });
    })
    .catch((error) => {
      apiErrorMessage({ error });
    });
};

const handleDoExport = async () => {
  const filter = {
    and: [
      ...DEFAULT_ORGANIZATION_FILTERS,
      {
        id: {
          in: selectedOrganizations.value.map((o) => o.id),
        },
      },
    ],
  };

  try {
    const tenantCsvExportCount = tenant.value.csvExportCount;
    const planExportCountMax = getExportMax(
      tenant.value.plan,
    );

    await showExportDialog({
      tenantCsvExportCount,
      planExportCountMax,
      badgeContent: pluralize('organization', selectedOrganizations.value.length, true),
    });

    trackEvent({
      key: FeatureEventKey.EXPORT_ORGANIZATIONS,
      type: EventType.FEATURE,
      properties: {
        path: route.path,
        bulk: true,
      },
    });

    await OrganizationService.export({
      filter,
      limit: selectedOrganizations.value.length,
      offset: null,
      segments: [selectedProjectGroup.value?.id],
    });

    await doRefreshCurrentUser(null);

    Message.success(
      'CSV download link will be sent to your e-mail',
    );
  } catch (error) {
    Message.error(
      'An error has occured while trying to export the CSV file. Please try again',
      {
        title: 'CSV Export failed',
      },
    );
  }
};

const handleCommand = async (command) => {
  if (command.action === 'export') {
    await handleDoExport();
  } else if (command.action === 'destroyAll') {
    await handleDoDestroyAllWithConfirm();
  } else if (command.action === 'mergeOrganizations') {
    await handleMergeOrganizations();
  } else if (command.action === 'markAsTeamOrganization') {
    trackEvent({
      key: FeatureEventKey.MARK_AS_TEAM_ORGANIZATION,
      type: EventType.FEATURE,
      properties: {
        path: route.path,
        bulk: true,
      },
    });

    Message.info(
      null,
      {
        title: 'Organizations are being updated',
      },
    );

    Promise.all(
      selectedOrganizations.value.map((row) => OrganizationService.update(row.id, {
        isTeamOrganization: command.value,
      })),
    ).then(() => {
      Message.closeAll();
      Message.success(
        `${pluralize(
          'Organization',
          selectedOrganizations.value.length,
          false,
        )} updated successfully`,
      );

      fetchOrganizations({
        reload: true,
      });
    })
      .catch(() => {
        Message.closeAll();
        Message.error('Error updating organizations');
      });
  }
};
</script>

<script>
export default {
  name: 'AppOrganizationListToolbar',
};
</script>
