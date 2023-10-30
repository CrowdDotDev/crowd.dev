<template>
  <!-- Edit -->
  <button
    :disabled="isEditLockedForSampleData"
    class="h-10 el-dropdown-menu__item w-full"
    type="button"
    @click="handleCommand({
      action: 'organizationEdit',
      organization,
    })"
  >
    <i class="ri-pencil-line text-base mr-2" /><span
      class="text-xs"
    >Edit organization</span>
  </button>

  <!-- Merge organization -->
  <button
    class="h-10 el-dropdown-menu__item w-full"
    type="button"
    :disabled="isEditLockedForSampleData"
    @click="handleCommand({
      action: 'organizationMerge',
      organization,
    })"
  >
    <i class="ri-shuffle-line text-base mr-2" /><span
      class="text-xs"
    >Merge organization</span>
  </button>

  <!-- Hubspot -->
  <button
    v-if="!isSyncingWithHubspot(organization)"
    class="h-10 el-dropdown-menu__item w-full"
    type="button"
    :disabled="!isHubspotConnected || (!organization.website && !organization.attributes?.sourceId?.hubspot)"
    @click="handleCommand({
      action: 'syncHubspot',
      organization,
    })"
  >
    <app-svg name="hubspot" class="h-4 w-4 text-current" />
    <span
      class="text-xs pl-2"
    >Sync with HubSpot</span>
  </button>
  <button
    v-else
    class="h-10 el-dropdown-menu__item w-full"
    type="button"
    :disabled="!isHubspotConnected"
    @click="handleCommand({
      action: 'stopSyncHubspot',
      organization,
    })"
  >
    <app-svg name="hubspot" class="h-4 w-4 text-current" />
    <span
      class="text-xs pl-2"
    >Stop sync with HubSpot</span>
  </button>

  <!-- Mark as Team Organization -->
  <button
    v-if="!organization.isTeamOrganization"
    class="h-10 el-dropdown-menu__item w-full"
    type="button"
    :disabled="isEditLockedForSampleData"
    @click="handleCommand({
      action: 'markOrganizationTeam',
      organization,
      value: true,
    })"
  >
    <i
      class="ri-bookmark-line text-base mr-2"
    /><span class="text-xs">Mark as team organization</span>
  </button>

  <!-- Unmark as Team Organization -->
  <button
    v-if="organization.isTeamOrganization"
    type="button"
    class="h-10 el-dropdown-menu__item w-full"
    :disabled="isEditLockedForSampleData"
    @click="handleCommand({
      action: 'markOrganizationTeam',
      organization,
      value: false,
    })"
  >
    <i
      class="ri-bookmark-2-line text-base mr-2"
    /><span class="text-xs">Unmark as team organization</span>
  </button>

  <el-divider class="border-gray-200 my-2" />

  <!-- Delete -->
  <button
    class="h-10 el-dropdown-menu__item w-full"
    :disabled="isDeleteLockedForSampleData"
    type="button"
    @click="handleCommand({
      action: 'organizationDelete',
      organization,
    })"
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

<script setup>
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  mapGetters,
} from '@/shared/vuex/vuex.helpers';
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

const route = useRoute();
const router = useRouter();

defineProps({
  organization: {
    type: Object,
    default: () => {},
  },
});

const emit = defineEmits([
  'merge',
  'closeDropdown',
]);

const store = useStore();

const { currentUser, currentTenant } = mapGetters('auth');

const organizationStore = useOrganizationStore();
const { fetchOrganizations, fetchOrganization } = organizationStore;

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

const isSyncingWithHubspot = (organization) => organization.attributes?.syncRemote?.hubspot || false;

const isHubspotConnected = computed(() => {
  const hubspot = CrowdIntegrations.getMappedConfig('hubspot', store);
  const enabledFor = hubspot.settings?.enabledFor || [];
  return hubspot.status === 'done' && enabledFor.includes(HubspotEntity.ORGANIZATIONS);
});

const doDestroyWithConfirm = async (id) => {
  try {
    await ConfirmDialog({
      type: 'danger',
      title: 'Delete organization',
      message:
        "Are you sure you want to proceed? You can't undo this action",
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      icon: 'ri-delete-bin-line',
    });

    await OrganizationService.destroyAll([id]);

    Message.success(
      i18n('entities.organization.destroy.success'),
    );
    emit('closeDropdown');

    await fetchOrganizations({
      reload: true,
    });
  } catch (error) {
    console.error(error);
  }
  return null;
};

const handleCommand = (command) => {
  const segments = route.query.segmentId ? [route.query.segmentId] : [route.query.projectGroup];

  if (command.action === 'organizationDelete') {
    return doDestroyWithConfirm(command.organization.id);
  } if (command.action === 'organizationEdit') {
    emit('closeDropdown');
    router.push({
      name: 'organizationEdit',
      params: {
        id: command.organization.id,
      },
      query: {
        segmentId: route.query.segmentId || route.query.projectGroup,
      },
    });
  } else if (command.action === 'organizationMerge') {
    emit('closeDropdown');
    emit('merge');
  } else if (
    command.action === 'syncHubspot' || command.action === 'stopSyncHubspot'
  ) {
    // Hubspot
    const sync = command.action === 'syncHubspot';
    (sync ? HubspotApiService.syncOrganization(command.organization.id) : HubspotApiService.stopSyncOrganization(command.organization.id))
      .then(() => {
        emit('closeDropdown');
        if (
          router.currentRoute.value.name === 'organization'
        ) {
          fetchOrganizations({
            reload: true,
          });
        } else {
          fetchOrganization(command.organization.id, segments);
        }
        if (sync) {
          Message.success('Organization is now syncing with HubSpot');
        } else {
          Message.success('Organization syncing stopped');
        }
      })
      .catch(() => {
        Message.error('There was an error');
      });
  } else if (command.action === 'markOrganizationTeam') {
    OrganizationService.update(command.organization.id, {
      isTeamOrganization: command.value,
    }, command.organization.segments).then(() => {
      Message.success('Organization updated successfully');
      emit('closeDropdown');

      if (
        router.currentRoute.value.name === 'organization'
      ) {
        fetchOrganizations({
          reload: true,
        });
      } else {
        fetchOrganization(command.organization.id, segments);
      }
    });
  }

  emit('closeDropdown');
  return null;
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
