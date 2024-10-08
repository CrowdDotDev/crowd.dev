<template>
  <!-- Unmerge -->
  <template v-if="organization.identities.length > 1 && !hideUnmerge && hasPermission(LfPermission.organizationEdit)">
    <button
      class="h-10 el-dropdown-menu__item w-full"
      type="button"
      @click="handleCommand({
        action: Actions.UNMERGE_IDENTITY,
        organization,
      })"
    >
      <i class="ri-link-unlink-m text-base mr-2" /><span class="text-xs">Unmerge identity</span>
    </button>
    <el-divider class="border-gray-200 my-2" />
  </template>

  <!-- Edit -->
  <router-link
    v-if="!hideEdit && hasPermission(LfPermission.organizationEdit)"
    :to="{
      name: 'organizationEdit',
      params: {
        id: organization.id,
      },
      query: {
        segmentId: route.query.segmentId || route.query.projectGroup,
      },
    }"
  >
    <button
      class="h-10 el-dropdown-menu__item w-full"
      type="button"
    >
      <i class="ri-pencil-line text-base mr-2" /><span class="text-xs">Edit organization</span>
    </button>
  </router-link>

  <!-- Merge organization -->
  <button
    v-if="!hideMerge && hasPermission(LfPermission.organizationEdit)"
    class="h-10 el-dropdown-menu__item w-full"
    type="button"
    :disabled="!hasPermission(LfPermission.mergeOrganizations)"
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
  <!--  <button-->
  <!--    v-if="!isSyncingWithHubspot(organization)"-->
  <!--    class="h-10 el-dropdown-menu__item w-full"-->
  <!--    type="button"-->
  <!--    :disabled="-->
  <!--      !isHubspotConnected-->
  <!--        || (!organization.website-->
  <!--          && !organization.attributes?.sourceId?.hubspot)-->
  <!--    "-->
  <!--    @click="-->
  <!--      handleCommand({-->
  <!--        action: Actions.SYNC_HUBSPOT,-->
  <!--        organization,-->
  <!--      })-->
  <!--    "-->
  <!--  >-->
  <!--    <lf-svg name="hubspot" class="h-4 w-4 text-current" />-->
  <!--    <span class="text-xs pl-2">Sync with HubSpot</span>-->
  <!--  </button>-->
  <!--  <button-->
  <!--    v-else-->
  <!--    class="h-10 el-dropdown-menu__item w-full"-->
  <!--    type="button"-->
  <!--    :disabled="!isHubspotConnected"-->
  <!--    @click="-->
  <!--      handleCommand({-->
  <!--        action: Actions.STOP_SYNC_HUBSPOT,-->
  <!--        organization,-->
  <!--      })-->
  <!--    "-->
  <!--  >-->
  <!--    <lf-svg name="hubspot" class="h-4 w-4 text-current" />-->
  <!--    <span class="text-xs pl-2">Stop sync with HubSpot</span>-->
  <!--  </button>-->

  <!-- Mark as Team Organization -->
  <template v-if="hasPermission(LfPermission.organizationEdit)">
    <el-tooltip
      placement="top"
      content="Mark as team organization if it is your own organization."
      popper-class="max-w-[260px]"
    >
      <span>
        <button
          v-if="!organization.isTeamOrganization"
          class="h-10 el-dropdown-menu__item w-full"
          type="button"
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
      </span>
    </el-tooltip>

    <!-- Unmark as Team Organization -->
    <button
      v-if="organization.isTeamOrganization"
      type="button"
      class="h-10 el-dropdown-menu__item w-full"
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
  </template>

  <template v-if="hasPermission(LfPermission.organizationDestroy)">
    <el-divider class="border-gray-200 my-2" />

    <!-- Delete -->
    <button
      class="h-10 el-dropdown-menu__item w-full"
      type="button"
      @click="
        handleCommand({
          action: Actions.DELETE_ORGANIZATION,
          organization,
        })
      "
    >
      <i
        class="ri-delete-bin-line text-base mr-2 text-red-500"
      /><span
        class="text-xs text-red-500"
      >Delete organization</span>
    </button>
  </template>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import Message from '@/shared/message/message';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import { i18n } from '@/i18n';
import { HubspotApiService } from '@/integrations/hubspot/hubspot.api.service';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import { OrganizationService } from '../organization-service';
import { Organization } from '../types/Organization';

enum Actions {
  DELETE_ORGANIZATION = 'deleteOrganization',
  MERGE_ORGANIZATION = 'mergeOrganization',
  UNMERGE_IDENTITY = 'unmergeIdentity',
  SYNC_HUBSPOT = 'syncHubspot',
  STOP_SYNC_HUBSPOT = 'stopSyncHubspot',
  MARK_ORGANIZATION_AS_TEAM_ORGANIZATION = 'markOrganizationAsTeamOrganization',
}

const route = useRoute();
const router = useRouter();

const emit = defineEmits<{(e: 'merge'): void, (e: 'unmerge'): void, (e: 'closeDropdown'): void }>();
defineProps<{
  organization: Organization;
  hideMerge?: boolean;
  hideUnmerge?: boolean;
  hideEdit?: boolean;
}>();

const { trackEvent } = useProductTracking();

const organizationStore = useOrganizationStore();

const { hasPermission } = usePermissions();

// const isSyncingWithHubspot = (organization: Organization) => organization.attributes?.syncRemote?.hubspot || false;
//
// const isHubspotConnected = computed(() => {
//   const hubspot = CrowdIntegrations.getMappedConfig('hubspot', store);
//   const enabledFor = hubspot.settings?.enabledFor || [];
//   return (
//     hubspot.status === 'done'
//     && enabledFor.includes(HubspotEntity.ORGANIZATIONS)
//   );
// });

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
      trackEvent({
        key: FeatureEventKey.DELETE_ORGANIZATION,
        type: EventType.FEATURE,
        properties: {
          path: router.currentRoute.value.path,
        },
      });

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

  // Unmerge identity
  if (command.action === Actions.UNMERGE_IDENTITY) {
    emit('closeDropdown');
    emit('unmerge');

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
    trackEvent({
      key: FeatureEventKey.MARK_AS_TEAM_ORGANIZATION,
      type: EventType.FEATURE,
      properties: {
        path: router.currentRoute.value.path,
      },
    });

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
