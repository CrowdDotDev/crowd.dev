<template>
  <router-link
    :to="{
      name: 'memberEdit',
      params: {
        id: member.id,
      },
    }"
    :class="{
      'pointer-events-none cursor-not-allowed':
        isEditLockedForSampleData,
    }"
  >
    <button
      class="h-10 el-dropdown-menu__item w-full mb-1"
      :disabled="isEditLockedForSampleData"
      type="button"
    >
      <i
        class="ri-pencil-line text-base mr-2"
      /><span class="text-xs">Edit contact</span>
    </button>
  </router-link>
  <el-tooltip
    placement="top"
    :content="!isEnrichmentFeatureEnabled()
      ? 'Upgrade your plan to increase your quota of available contact enrichments'
      : 'Contact enrichment requires an associated GitHub profile or Email'"
    :disabled="isEnrichmentDisabledForMember || isEnrichmentFeatureEnabled()"
    popper-class="max-w-[260px]"
  >
    <span>
      <button
        class="h-10 el-dropdown-menu__item w-full mb-1"
        :disabled="isEnrichmentActionDisabled"
        type="button"
        @click="handleCommand({
          action: 'memberEnrich',
          member,
        })"
      >
        <app-svg
          name="enrichment"
          class="max-w-[16px] h-4"
          color="#9CA3AF"
        />
        <span
          class="ml-2 text-xs"
          :class="{
            'text-gray-400': isEnrichmentDisabledForMember,
          }"
        >{{
          member.lastEnriched
            ? 'Re-enrich contact'
            : 'Enrich contact'
        }}</span>
      </button>
    </span>
  </el-tooltip>
  <button
    class="h-10 el-dropdown-menu__item w-full"
    :disabled="isEditLockedForSampleData"
    type="button"
    @click="handleCommand({
      action: 'memberMerge',
      member,
    })"
  >
    <i class="ri-group-line text-base mr-2" /><span
      class="text-xs"
    >Merge contact</span>
  </button>

  <!-- Hubspot -->
  <el-tooltip
    placement="top"
    content="Upgrade your plan to create a 2-way sync with HubSpot"
    :disabled="isHubspotFeatureEnabled"
    popper-class="max-w-[260px]"
  >
    <span>
      <button
        v-if="!isSyncingWithHubspot"
        class="h-10 el-dropdown-menu__item w-full"
        :disabled="isHubspotActionDisabled"
        type="button"
        @click="handleCommand({
          action: 'syncHubspot',
          member,
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
        :disabled="isHubspotActionDisabled"
        type="button"
        @click="handleCommand({
          action: 'stopSyncHubspot',
          member,
        })"
      >
        <app-svg name="hubspot" class="h-4 w-4 text-current" />
        <span
          class="text-xs pl-2"
        >Stop sync with HubSpot</span>
      </button>
    </span>
  </el-tooltip>

  <button
    v-if="!member.attributes.isTeamMember?.default"
    class="h-10 el-dropdown-menu__item w-full"
    :disabled="isEditLockedForSampleData"
    type="button"
    @click="handleCommand({
      action: 'memberMarkAsTeamMember',
      member,
      value: true,
    })"
  >
    <i
      class="ri-bookmark-line text-base mr-2"
    /><span class="text-xs">Mark as team contact</span>
  </button>
  <button
    v-if="member.attributes.isTeamMember?.default"
    class="h-10 el-dropdown-menu__item w-full"
    :disabled="isEditLockedForSampleData"
    type="button"
    @click="handleCommand({
      action: 'memberMarkAsTeamMember',
      member,
      value: false,
    })"
  >
    <i
      class="ri-bookmark-2-line text-base mr-2"
    /><span class="text-xs">Unmark as team contact</span>
  </button>
  <button
    v-if="!member.attributes.isBot?.default"
    class="h-10 el-dropdown-menu__item w-full"
    :disabled="isEditLockedForSampleData"
    type="button"
    @click="handleCommand({
      action: 'memberMarkAsBot',
      member,
    })"
  >
    <i class="ri-robot-line text-base mr-2" /><span
      class="text-xs"
    >Mark as bot</span>
  </button>
  <button
    v-if="member.attributes.isBot?.default"
    class="h-10 el-dropdown-menu__item w-full"
    :disabled="isEditLockedForSampleData"
    type="button"
    @click="handleCommand({
      action: 'memberUnmarkAsBot',
      member,
    })"
  >
    <i class="ri-robot-line text-base mr-2" /><span
      class="text-xs"
    >Unmark as bot</span>
  </button>
  <el-divider class="border-gray-200" />
  <button
    class="h-10 el-dropdown-menu__item w-full"
    :disabled="isDeleteLockedForSampleData"
    type="button"
    @click="handleCommand({
      action: 'memberDelete',
      member,
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
    >Delete contact</span>
  </button>
</template>

<script setup>
import {
  mapActions,
  mapGetters,
} from '@/shared/vuex/vuex.helpers';
import { MemberService } from '@/modules/member/member-service';
import Message from '@/shared/message/message';
import { MemberPermissions } from '@/modules/member/member-permissions';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import AppSvg from '@/shared/svg/svg.vue';
import { useMemberStore } from '@/modules/member/store/pinia';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { HubspotEntity } from '@/integrations/hubspot/types/HubspotEntity';
import { HubspotApiService } from '@/integrations/hubspot/hubspot.api.service';
import { isEnrichmentFeatureEnabled } from '@/modules/member/member-enrichment';
import { FeatureFlag, FEATURE_FLAGS } from '@/utils/featureFlag';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { computed } from 'vue';

const emit = defineEmits(['merge', 'closeDropdown']);
const props = defineProps({
  member: {
    type: Object,
    default: () => {},
  },
});

const store = useStore();
const route = useRoute();

const { currentUser, currentTenant } = mapGetters('auth');
const { doFind, doEnrich } = mapActions('member');

const memberStore = useMemberStore();
const { fetchMembers } = memberStore;

const isEditLockedForSampleData = computed(() => new MemberPermissions(
  currentTenant.value,
  currentUser.value,
).editLockedForSampleData);

const isDeleteLockedForSampleData = computed(() => new MemberPermissions(
  currentTenant.value,
  currentUser.value,
).destroyLockedForSampleData);

const isEnrichmentDisabledForMember = computed(() => (
  !props.member.username?.github?.length
            && !props.member.emails?.length
));

const isEnrichmentActionDisabled = computed(() => isEnrichmentDisabledForMember.value
  || isEditLockedForSampleData.value || !isEnrichmentFeatureEnabled());

const isSyncingWithHubspot = computed(() => props.member.attributes?.syncRemote?.hubspot || false);

const isHubspotConnected = computed(() => {
  const hubspot = CrowdIntegrations.getMappedConfig('hubspot', store);
  const enabledFor = hubspot.settings?.enabledFor || [];

  return hubspot.status === 'done' && enabledFor.includes(HubspotEntity.MEMBERS);
});

const isHubspotDisabledForMember = computed(() => props.member.emails.length === 0);

const isHubspotFeatureEnabled = computed(() => FeatureFlag.isFlagEnabled(
  FEATURE_FLAGS.hubspot,
));

const isHubspotActionDisabled = computed(() => !isHubspotConnected.value || isHubspotDisabledForMember.value || !isHubspotFeatureEnabled.value);

const doDestroyWithConfirm = async (id) => {
  try {
    await ConfirmDialog({
      type: 'danger',
      title: 'Delete contact',
      message:
            "Are you sure you want to proceed? You can't undo this action",
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      icon: 'ri-delete-bin-line',
    });

    await MemberService.destroyAll([id]);

    Message.success('Contact successfully deleted');

    emit('closeDropdown');

    await fetchMembers({ reload: true });
  } catch (error) {
    // no
  }
  return null;
};

const handleCommand = async (command) => {
  if (command.action === 'memberDelete') {
    await doDestroyWithConfirm(command.member.id);
  } else if (
    command.action === 'syncHubspot' || command.action === 'stopSyncHubspot'
  ) {
    // Hubspot
    const sync = command.action === 'syncHubspot';
    (sync ? HubspotApiService.syncMember(command.member.id) : HubspotApiService.stopSyncMember(command.member.id))
      .then(() => {
        emit('closeDropdown');

        if (route.name === 'member') {
          fetchMembers({ reload: true });
        } else {
          doFind(command.member.id);
        }
        if (sync) {
          Message.success('Contact is now syncing with HubSpot');
        } else {
          Message.success('Contact syncing stopped');
        }
      })
      .catch(() => {
        Message.error('There was an error');
      });
  } else if (
    command.action === 'memberMarkAsTeamMember'
  ) {
    await MemberService.update(command.member.id, {
      attributes: {
        ...command.member.attributes,
        isTeamMember: {
          default: command.value,
        },
      },
    });

    emit('closeDropdown');

    await fetchMembers({ reload: true });

    Message.success('Contact updated successfully');

    if (route.name === 'member') {
      await fetchMembers({ reload: true });
    } else {
      doFind(command.member.id);
    }
  } else if (command.action === 'memberMarkAsBot' || command.action === 'memberUnmarkAsBot') {
    await MemberService.update(command.member.id, {
      attributes: {
        ...command.member.attributes,
        isBot: {
          default: command.action === 'memberMarkAsBot',
        },
      },
    });

    emit('closeDropdown');

    await fetchMembers({ reload: true });
    Message.success('Contact updated successfully');
    if (route.name === 'member') {
      await fetchMembers({ reload: true });
    } else {
      doFind(command.member.id);
    }
  } else if (command.action === 'memberMerge') {
    emit('closeDropdown');
    emit('merge');
  } else if (command.action === 'memberEnrich') {
    await doEnrich(command.member.id);

    emit('closeDropdown');

    await fetchMembers({ reload: true });
  }

  emit('closeDropdown');
  return null;
};

</script>

<style lang="scss" scoped>
.el-dropdown__popper .el-dropdown__list {
  @apply p-2;
}

// Override divider margin
.el-divider--horizontal {
  @apply my-2;
}

.el-dropdown-menu__item:disabled {
  @apply cursor-not-allowed text-gray-400;
}

.el-dropdown-menu__item:disabled:hover {
  @apply bg-white;
}
</style>
