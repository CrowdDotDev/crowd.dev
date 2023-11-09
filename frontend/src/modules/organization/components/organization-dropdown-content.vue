<template>
  <!-- Edit -->
  <router-link
    :to="{
      name: 'organizationEdit',
      params: {
        id: organization.id,
      },
      query: {
        segmentId: route.query.segmentId || route.query.projectGroup,
      },
    }"
    :class="{
      'pointer-events-none cursor-not-allowed': isEditLockedForSampleData,
    }"
  >
    <button
      :disabled="isEditLockedForSampleData"
      class="h-10 el-dropdown-menu__item w-full"
      type="button"
    >
      <i class="ri-pencil-line text-base mr-2" /><span class="text-xs">Edit organization</span>
    </button>
  </router-link>

  <!-- Merge organization -->
  <button
    class="h-10 el-dropdown-menu__item w-full"
    type="button"
    :disabled="isEditLockedForSampleData"
    @click="
      handleCommand({
        action: Actions.MERGE_ORGANIZATION,
        organization,
      })
    "
  >
    <i class="ri-shuffle-line text-base mr-2" /><span class="text-xs">Merge organization</span>
  </button>

  <!-- Hubspot -->
  <button
    v-if="!isSyncingWithHubspot(organization)"
    class="h-10 el-dropdown-menu__item w-full"
    type="button"
    :disabled="
      !isHubspotConnected
        || (!organization.website
          && !organization.attributes?.sourceId?.hubspot)
    "
    @click="
      handleCommand({
        action: Actions.SYNC_HUBSPOT,
        organization,
      })
    "
  >
    <app-svg name="hubspot" class="h-4 w-4 text-current" />
    <span class="text-xs pl-2">Sync with HubSpot</span>
  </button>
  <button
    v-else
    class="h-10 el-dropdown-menu__item w-full"
    type="button"
    :disabled="!isHubspotConnected"
    @click="
      handleCommand({
        action: Actions.STOP_SYNC_HUBSPOT,
        organization,
      })
    "
  >
    <app-svg name="hubspot" class="h-4 w-4 text-current" />
    <span class="text-xs pl-2">Stop sync with HubSpot</span>
  </button>

  <!-- Mark as Team Organization -->
  <button
    v-if="!organization.isTeamOrganization"
    class="h-10 el-dropdown-menu__item w-full"
    type="button"
    :disabled="isEditLockedForSampleData"
    @click="
      handleCommand({
        action: Actions.MARK_ORGANIZATION_AS_TEAM_ORGANIZATION,
        organization,
        value: true,
      })
    "
  >
    <i class="ri-bookmark-line text-base mr-2" /><span class="text-xs">Mark as team organization</span>
  </button>

  <!-- Unmark as Team Organization -->
  <button
    v-if="organization.isTeamOrganization"
    type="button"
    class="h-10 el-dropdown-menu__item w-full"
    :disabled="isEditLockedForSampleData"
    @click="
      handleCommand({
        action: Actions.MARK_ORGANIZATION_AS_TEAM_ORGANIZATION,
        organization,
        value: false,
      })
    "
  >
    <i class="ri-bookmark-2-line text-base mr-2" /><span class="text-xs">Unmark as team organization</span>
  </button>

  <el-divider class="border-gray-200 my-2" />

  <!-- Delete -->
  <button
    class="h-10 el-dropdown-menu__item w-full"
    :disabled="isDeleteLockedForSampleData"
    type="button"
    @click="
      handleCommand({
        action: Actions.DELETE_ORGANIZATION,
        organization,
      })
    "
  >
    <i
      class="ri-delete-bin-line text-base mr-2"
      :class="{
        'text-red-500': !isDeleteLockedForSampleData,
      }"
    /><span
      class="text-xs"
      :class="{
        'text-red-500': !isDeleteLockedForSampleData,
      }"
    >Delete organization</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import Message from '@/shared/message/message';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import { i18n } from '@/i18n';
import AppSvg from '@/shared/svg/svg.vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { HubspotEntity } from '@/integrations/hubspot/types/HubspotEntity';
import { HubspotApiService } from '@/integrations/hubspot/hubspot.api.service';
import { useStore } from 'vuex';
import { OrganizationService } from '../organization-service';
import { OrganizationPermissions } from '../organization-permissions';
import { Organization } from '../types/Organization';

enum Actions {
  DELETE_ORGANIZATION = 'deleteOrganization',
  MERGE_ORGANIZATION = 'mergeOrganization',
  SYNC_HUBSPOT = 'syncHubspot',
  STOP_SYNC_HUBSPOT = 'stopSyncHubspot',
  MARK_ORGANIZATION_AS_TEAM_ORGANIZATION = 'markOrganizationAsTeamOrganization',
}

const route = useRoute();
const router = useRouter();

const emit = defineEmits<{(e: 'merge'): void, (e: 'closeDropdown'): void }>();
defineProps<{
  organization: Organization;
}>();

const store = useStore();

const { currentUser, currentTenant } = mapGetters('auth');

const organizationStore = useOrganizationStore();

const isEditLockedForSampleData = computed(
  () => new OrganizationPermissions(currentTenant.value, currentUser.value)
    .editLockedForSampleData,
);
const isDeleteLockedForSampleData = computed(
  () => new OrganizationPermissions(currentTenant.value, currentUser.value)
    .destroyLockedForSampleData,
);

const isSyncingWithHubspot = (organization: Organization) => organization.attributes?.syncRemote?.hubspot || false;

const isHubspotConnected = computed(() => {
  const hubspot = CrowdIntegrations.getMappedConfig('hubspot', store);
  const enabledFor = hubspot.settings?.enabledFor || [];
  return (
    hubspot.status === 'done'
    && enabledFor.includes(HubspotEntity.ORGANIZATIONS)
  );
});

const doManualAction = async ({
  loadingMessage,
  actionFn,
  successMessage,
  errorMessage,
}: {
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  actionFn: Promise<any>;
}) => {
  emit('closeDropdown');

  if (loadingMessage) {
    Message.info(null, {
      title: loadingMessage,
    });
  }

  return actionFn
    .then(() => {
      if (successMessage) {
        Message.closeAll();
        Message.success(successMessage);
      }
      Promise.resolve();
    })
    .catch(() => {
      if (errorMessage) {
        Message.closeAll();
        Message.error(errorMessage);
      }
      Promise.reject();
    });
};

const handleCommand = (command: {
  action: Actions;
  organization: Organization;
  value?: boolean;
}) => {
  // Delete organization
  if (command.action === Actions.DELETE_ORGANIZATION) {
    ConfirmDialog({
      type: 'danger',
      title: 'Delete organization',
      message: "Are you sure you want to proceed? You can't undo this action",
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      icon: 'ri-delete-bin-line',
    }).then(() => {
      doManualAction({
        loadingMessage: 'Organization is being deleted',
        successMessage: i18n('entities.organization.destroy.success'),
        errorMessage: 'Something went wrong',
        actionFn: OrganizationService.destroyAll([command.organization.id]),
      }).then(() => {
        organizationStore.fetchOrganizations({
          reload: true,
        });
      });
    });

    return;
  }

  // Merge organization
  if (command.action === Actions.MERGE_ORGANIZATION) {
    emit('closeDropdown');
    emit('merge');

    return;
  }

  // Sync with hubspot
  if (
    command.action === Actions.SYNC_HUBSPOT
    || command.action === Actions.STOP_SYNC_HUBSPOT
  ) {
    const isSyncing = command.action === Actions.SYNC_HUBSPOT;

    doManualAction({
      loadingMessage: isSyncing
        ? 'Organization is being synced with Hubspot'
        : 'Organization syncing with Hubspot is being stopped',
      successMessage: isSyncing
        ? 'Organization is now syncing with HubSpot'
        : 'Organization syncing stopped',
      errorMessage: 'Something went wrong',
      actionFn: isSyncing
        ? HubspotApiService.syncOrganization(command.organization.id)
        : HubspotApiService.stopSyncOrganization(command.organization.id),
    }).then(() => {
      if (router.currentRoute.value.name === 'organization') {
        organizationStore.fetchOrganizations({
          reload: true,
        });
      } else {
        organizationStore.fetchOrganization(command.organization.id, segments);
      }
    });

    return;
  }

  // Mark as team organization
  if (command.action === Actions.MARK_ORGANIZATION_AS_TEAM_ORGANIZATION) {
    doManualAction({
      loadingMessage: 'Organization is being updated',
      successMessage: 'Organization updated successfully',
      errorMessage: 'Something went wrong',
      actionFn: OrganizationService.update(command.organization.id, {
        isTeamOrganization: command.value,
      }, command.organization.segments),
    }).then(() => {
      if (router.currentRoute.value.name === 'organization') {
        organizationStore.fetchOrganizations({
          reload: true,
        });
      } else {
        organizationStore.fetchOrganization(command.organization.id, segments);
      }
    });

    return;
  }

  emit('closeDropdown');
};
</script>

<style lang="scss" scoped>
.el-dropdown-menu__item:disabled {
  @apply cursor-not-allowed text-gray-400;
}

.el-dropdown-menu__item:disabled:hover {
  @apply bg-white;
}
</style>
