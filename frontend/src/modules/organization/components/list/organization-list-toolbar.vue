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
          v-if="selectedOrganizations.length === 2"
          content="Coming soon"
          placement="top"
          :disabled="hasPermissionsToMerge"
        >
          <span>
            <el-dropdown-item
              :command="{
                action: 'mergeOrganizations',
              }"
              :disabled="
                isPermissionReadOnly
                  || isEditLockedForSampleData
                  || !hasPermissionsToMerge
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
          v-if="markAsTeamOrganizationOptions"
          :command="{
            action: 'markAsTeamOrganization',
            value: markAsTeamOrganizationOptions.value,
          }"
          :disabled="
            isPermissionReadOnly
              || isEditLockedForSampleData
          "
        >
          <i
            class="ri-lg mr-1"
            :class="markAsTeamOrganizationOptions.icon"
          />
          {{ markAsTeamOrganizationOptions.copy }}
        </el-dropdown-item>

        <hr class="border-gray-200 my-1 mx-2" />

        <el-dropdown-item
          :command="{ action: 'destroyAll' }"
          :disabled="
            isPermissionReadOnly
              || isDeleteLockedForSampleData
          "
        >
          <div
            class="flex items-center"
            :class="{
              'text-red-500': !isDeleteLockedForSampleData,
            }"
          >
            <i class="ri-lg ri-delete-bin-line mr-2" />
            <span>Delete organizations</span>
          </div>
        </el-dropdown-item>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import pluralize from 'pluralize';
import { computed } from 'vue';
import {
  mapActions,
  mapGetters,
} from '@/shared/vuex/vuex.helpers';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import Message from '@/shared/message/message';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import { storeToRefs } from 'pinia';
import { DEFAULT_ORGANIZATION_FILTERS } from '@/modules/organization/store/constants';
import { getExportMax, showExportDialog } from '@/modules/member/member-export-limit';
import useOrganizationMergeMessage from '@/shared/modules/merge/config/useOrganizationMergeMessage';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { OrganizationPermissions } from '../../organization-permissions';
import { OrganizationService } from '../../organization-service';

const { currentUser, currentTenant } = mapGetters('auth');
const { doRefreshCurrentUser } = mapActions('auth');

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const organizationStore = useOrganizationStore();
const {
  selectedOrganizations,
  filters,
} = storeToRefs(organizationStore);
const { fetchOrganizations } = organizationStore;

const isPermissionReadOnly = computed(
  () => new OrganizationPermissions(
    currentTenant.value,
    currentUser.value,
  ).edit === false,
);

const isEditLockedForSampleData = computed(
  () => new OrganizationPermissions(
    currentTenant.value,
    currentUser.value,
  ).editLockedForSampleData,
);
const isDeleteLockedForSampleData = computed(
  () => new OrganizationPermissions(
    currentTenant.value,
    currentUser.value,
  ).destroyLockedForSampleData,
);

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

const hasPermissionsToMerge = computed(() => new OrganizationPermissions(
  currentTenant.value,
  currentUser.value,
)?.mergeOrganizations);

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
    const tenantCsvExportCount = currentTenant.value.csvExportCount;
    const planExportCountMax = getExportMax(
      currentTenant.value.plan,
    );

    await showExportDialog({
      tenantCsvExportCount,
      planExportCountMax,
      badgeContent: pluralize('organization', selectedOrganizations.value.length, true),
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
