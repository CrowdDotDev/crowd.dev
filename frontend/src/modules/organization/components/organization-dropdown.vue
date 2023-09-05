<template>
  <div>
    <el-dropdown
      v-if="!isReadOnly && organization"
      trigger="click"
      placement="bottom-end"
      @command="handleCommand"
    >
      <button
        class="el-dropdown-link btn p-1.5 rounder-md hover:bg-gray-200 text-gray-600"
        type="button"
        @click.prevent.stop
      >
        <i class="text-xl ri-more-fill" />
      </button>
      <template #dropdown>
        <!-- Edit -->
        <el-dropdown-item
          :command="{
            action: 'organizationEdit',
            organization,
          }"
          :disabled="isEditLockedForSampleData"
          class="h-10"
        >
          <i class="ri-pencil-line text-base mr-2" /><span
            class="text-xs"
          >Edit organization</span>
        </el-dropdown-item>

        <!-- Hubspot -->
        <el-dropdown-item
          v-if="!isSyncingWithHubspot(organization)"
          class="h-10"
          :command="{
            action: 'syncHubspot',
            organization,
          }"
          :disabled="!isHubspotConnected || (!organization.website && !organization.attributes?.sourceId?.hubspot)"
        >
          <app-svg name="hubspot" class="h-4 w-4 text-current" />
          <span
            class="text-xs pl-2"
          >Sync with HubSpot</span>
        </el-dropdown-item>
        <el-dropdown-item
          v-else
          class="h-10"
          :command="{
            action: 'stopSyncHubspot',
            organization,
          }"
          :disabled="!isHubspotConnected"
        >
          <app-svg name="hubspot" class="h-4 w-4 text-current" />
          <span
            class="text-xs pl-2"
          >Stop sync with HubSpot</span>
        </el-dropdown-item>

        <!-- Mark as Team Organization -->
        <el-dropdown-item
          v-if="!organization.isTeamOrganization"
          :command="{
            action: 'markOrganizationTeam',
            organization,
            value: true,
          }"
          class="h-10"
          :disabled="isEditLockedForSampleData"
        >
          <i
            class="ri-bookmark-line text-base mr-2"
          /><span class="text-xs">Mark as team organization</span>
        </el-dropdown-item>

        <!-- Unmark as Team Organization -->
        <el-dropdown-item
          v-if="organization.isTeamOrganization"
          :command="{
            action: 'markOrganizationTeam',
            organization,
            value: false,
          }"
          class="h-10"
          :disabled="isEditLockedForSampleData"
        >
          <i
            class="ri-bookmark-2-line text-base mr-2"
          /><span class="text-xs">Unmark as team organization</span>
        </el-dropdown-item>

        <el-divider class="border-gray-200 my-2" />

        <!-- Delete -->
        <el-dropdown-item
          class="h-10"
          :command="{
            action: 'organizationDelete',
            organization,
          }"
          :disabled="isDeleteLockedForSampleData"
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
        </el-dropdown-item>
      </template>
    </el-dropdown>
  </div>
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

const store = useStore();

const { currentUser, currentTenant } = mapGetters('auth');

const organizationStore = useOrganizationStore();
const { fetchOrganizations, fetchOrganization } = organizationStore;

const isReadOnly = computed(
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
    await fetchOrganizations({
      reload: true,
    });
  } catch (error) {
    console.error(error);
  }
  return null;
};

const handleCommand = (command) => {
  if (command.action === 'organizationDelete') {
    return doDestroyWithConfirm(command.organization.id);
  } if (command.action === 'organizationEdit') {
    router.push({
      name: 'organizationEdit',
      params: {
        id: command.organization.id,
      },
      query: {
        segmentId: route.query.segmentId || route.query.projectGroup,
      },
    });
  } else if (
    command.action === 'syncHubspot' || command.action === 'stopSyncHubspot'
  ) {
    // Hubspot
    const sync = command.action === 'syncHubspot';
    (sync ? HubspotApiService.syncOrganization(command.organization.id) : HubspotApiService.stopSyncOrganization(command.organization.id))
      .then(() => {
        if (
          router.currentRoute.value.name === 'organization'
        ) {
          fetchOrganizations({
            reload: true,
          });
        } else {
          fetchOrganization(command.organization.id);
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

      if (
        router.currentRoute.value.name === 'organization'
      ) {
        fetchOrganizations({
          reload: true,
        });
      } else {
        fetchOrganization(command.organization.id);
      }
    });
  }
  return null;
};
</script>

<script>
export default {
  name: 'AppOrganizationDropdown',
};
</script>
