<template>
  <template v-if="!isMasked(props.member as Contributor) && identities.length > 1 && !props.hideUnmerge && hasPermission(LfPermission.memberEdit)">
    <button
      class="h-10 el-dropdown-menu__item w-full"
      type="button"
      @click="handleCommand({
        action: Actions.UNMERGE_IDENTITY,
        member,
      })"
    >
      <i class="ri-link-unlink-m text-base mr-2" /><span class="text-xs">Unmerge identity</span>
    </button>
    <el-divider class="border-gray-200" />
  </template>

  <router-link
    v-if="!props.hideEdit && hasPermission(LfPermission.memberEdit)"
    :to="{
      name: 'memberView',
      params: {
        id: member.id,
      },
    }"
  >
    <button
      class="h-10 el-dropdown-menu__item w-full mb-1"
      type="button"
    >
      <i class="ri-pencil-line text-base mr-2" />
      <span class="text-xs">Edit profile</span>
    </button>
  </router-link>
  <button
    v-if="isFindGitHubFeatureEnabled"
    class="h-10 el-dropdown-menu__item w-full mb-1"
    type="button"
    :disabled="isFindingGitHubDisabled"
    @click="handleCommand({
      action: Actions.FIND_GITHUB,
      member,
    })"
  >
    <span
      class="max-w-[16px]"
      color="#9CA3AF"
    ><i class="ri-github-fill" /></span>
    <span class="ml-2 text-xs"> Find GitHub </span>
  </button>

  <button
    v-if="!isMasked(props.member as Contributor) && !props.hideMerge && hasPermission(LfPermission.mergeMembers)"
    class="h-10 el-dropdown-menu__item w-full"
    :disabled="!hasPermission(LfPermission.mergeMembers)"
    type="button"
    @click="
      handleCommand({
        action: Actions.MERGE_CONTACT,
        member,
      })
    "
  >
    <i class="ri-group-line text-base mr-2" /><span class="text-xs">Merge profile</span>
  </button>

  <!-- Hubspot -->
  <!--  <button-->
  <!--    v-if="!isSyncingWithHubspot"-->
  <!--    class="h-10 el-dropdown-menu__item w-full"-->
  <!--    :disabled="isHubspotActionDisabled"-->
  <!--    type="button"-->
  <!--    @click="handleCommand({-->
  <!--      action: Actions.SYNC_HUBSPOT,-->
  <!--      member,-->
  <!--    })-->
  <!--    "-->
  <!--  >-->
  <!--    <lf-svg name="hubspot" class="h-4 w-4 text-current" />-->
  <!--    <span-->
  <!--      class="text-xs pl-2"-->
  <!--    >Sync with HubSpot</span>-->
  <!--  </button>-->
  <!--  <button-->
  <!--    v-else-->
  <!--    class="h-10 el-dropdown-menu__item w-full"-->
  <!--    :disabled="isHubspotActionDisabled"-->
  <!--    type="button"-->
  <!--    @click="handleCommand({-->
  <!--      action: Actions.STOP_SYNC_HUBSPOT,-->
  <!--      member,-->
  <!--    })-->
  <!--    "-->
  <!--  >-->
  <!--    <lf-svg name="hubspot" class="h-4 w-4 text-current" />-->
  <!--    <span-->
  <!--      class="text-xs pl-2"-->
  <!--    >Stop sync with HubSpot</span>-->
  <!--  </button>-->

  <template v-if="hasPermission(LfPermission.memberEdit)">
    <el-tooltip
      placement="top"
      content="Mark as team member if they belong to your own organization"
      popper-class="max-w-[260px]"
    >
      <span>
        <button
          v-if="!member.attributes?.isTeamMember?.default"
          class="h-10 el-dropdown-menu__item w-full"
          type="button"
          @click="
            handleCommand({
              action: Actions.MARK_CONTACT_AS_TEAM_CONTACT,
              member,
              value: true,
            })
          "
        >
          <i class="ri-bookmark-line text-base mr-2" /><span class="text-xs">Mark as team member</span>
        </button>
      </span>
    </el-tooltip>
    <button
      v-if="member.attributes?.isTeamMember?.default"
      class="h-10 el-dropdown-menu__item w-full"
      type="button"
      @click="
        handleCommand({
          action: Actions.MARK_CONTACT_AS_TEAM_CONTACT,
          member,
          value: false,
        })
      "
    >
      <i class="ri-bookmark-2-line text-base mr-2" /><span class="text-xs">Unmark as team member</span>
    </button>
    <button
      v-if="!member.attributes.isBot?.default"
      class="h-10 el-dropdown-menu__item w-full"
      type="button"
      @click="
        handleCommand({
          action: Actions.MARK_CONTACT_AS_BOT,
          member,
        })
      "
    >
      <i class="ri-robot-line text-base mr-2" /><span class="text-xs">Mark as bot</span>
    </button>
    <button
      v-if="member.attributes.isBot?.default"
      class="h-10 el-dropdown-menu__item w-full"
      type="button"
      @click="
        handleCommand({
          action: Actions.UNMARK_CONTACT_AS_BOT,
          member,
        })
      "
    >
      <i class="ri-robot-line text-base mr-2" /><span class="text-xs">Unmark as bot</span>
    </button>
  </template>
  <template v-if="hasPermission(LfPermission.memberDestroy)">
    <el-divider class="border-gray-200" />
    <button
      class="h-10 el-dropdown-menu__item w-full"
      type="button"
      @click="
        handleCommand({
          action: Actions.DELETE_CONTACT,
          member,
        })
      "
    >
      <i
        class="ri-delete-bin-line text-base mr-2 text-red-500"
      /><span
        class="text-xs text-red-500"
      >Delete profile</span>
    </button>
  </template>
</template>

<script setup lang="ts">
import { mapActions } from '@/shared/vuex/vuex.helpers';
import { MemberService } from '@/modules/member/member-service';
import Message from '@/shared/message/message';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import { useMemberStore } from '@/modules/member/store/pinia';
import { HubspotApiService } from '@/integrations/hubspot/hubspot.api.service';
import { FEATURE_FLAGS, FeatureFlag } from '@/utils/featureFlag';
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import useContributorHelpers from '@/modules/contributor/helpers/contributor.helpers';
import { Contributor } from '@/modules/contributor/types/Contributor';
import { Member } from '../types/Member';

enum Actions {
  DELETE_CONTACT = 'deleteContact',
  SYNC_HUBSPOT = 'syncHubspot',
  STOP_SYNC_HUBSPOT = 'stopSyncHubspot',
  MARK_CONTACT_AS_TEAM_CONTACT = 'markContactAsTeamContact',
  MARK_CONTACT_AS_BOT = 'markContactAsBot',
  UNMARK_CONTACT_AS_BOT = 'unmarkContactAsBot',
  MERGE_CONTACT = 'mergeContact',
  UNMERGE_IDENTITY = 'unmergeIdentity',
  FIND_GITHUB = 'findGithub'
}

const emit = defineEmits<{(e: 'merge'): void, (e: 'unmerge'): void, (e: 'closeDropdown'): void, (e: 'findGithub'): void }>();
const props = defineProps<{
  member: Member;
  hideMerge?: boolean;
  hideEdit?: boolean;
  hideUnmerge?: boolean;
}>();

const route = useRoute();

const { doFind } = mapActions('member');

const { trackEvent } = useProductTracking();

const { isMasked } = useContributorHelpers();

const { selectedProjectGroup } = storeToRefs(useLfSegmentsStore());

const memberStore = useMemberStore();

const { hasPermission } = usePermissions();

// const isSyncingWithHubspot = computed(
//   () => props.member.attributes?.syncRemote?.hubspot || false,
// );

// const isHubspotConnected = computed(() => {
//   const hubspot = CrowdIntegrations.getMappedConfig('hubspot', store);
//   const enabledFor = hubspot.settings?.enabledFor || [];
//
//   return (
//     hubspot.status === 'done' && enabledFor.includes(HubspotEntity.MEMBERS)
//   );
// });
//
// const isHubspotDisabledForMember = computed(
//   () => (props.member.identities || []).filter((i) => i.type === 'email').length === 0,
// );

// const isHubspotActionDisabled = computed(() => !isHubspotConnected.value || isHubspotDisabledForMember.value);

const isFindingGitHubDisabled = computed(() => (
  !!props.member.username?.github
));

const isFindGitHubFeatureEnabled = computed(() => FeatureFlag.isFlagEnabled(
  FEATURE_FLAGS.findGitHub,
));

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

const handleCommand = async (command: {
  action: Actions;
  member: Member;
  value?: boolean;
}) => {
  // Delete contact
  if (command.action === Actions.DELETE_CONTACT) {
    ConfirmDialog({
      type: 'danger',
      title: 'Delete profile',
      message: "Are you sure you want to proceed? You can't undo this action",
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      icon: 'ri-delete-bin-line',
    }).then(() => {
      trackEvent({
        key: FeatureEventKey.DELETE_MEMBER,
        type: EventType.FEATURE,
        properties: {
          path: route.path,
        },
      });

      doManualAction({
        loadingMessage: 'Profile is being deleted',
        successMessage: 'Profile successfully deleted',
        errorMessage: 'Something went wrong',
        actionFn: MemberService.destroyAll([command.member.id]),
      }).then(() => {
        memberStore.fetchMembers({ reload: true });
      });
    });

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
        ? 'Profile is being synced with Hubspot'
        : 'Profile syncing with Hubspot is being stopped',
      successMessage: isSyncing
        ? 'Profile is now syncing with HubSpot'
        : 'Profile syncing stopped',
      errorMessage: 'Something went wrong',
      actionFn: isSyncing
        ? HubspotApiService.syncMember(command.member.id)
        : HubspotApiService.stopSyncMember(command.member.id),
    }).then(() => {
      if (route.name === 'member') {
        memberStore.fetchMembers({ reload: true });
      } else {
        doFind({
          id: command.member.id,
          segments: [selectedProjectGroup.value?.id],
        });
      }
    });

    return;
  }

  // Mark as team contact
  if (command.action === Actions.MARK_CONTACT_AS_TEAM_CONTACT) {
    trackEvent({
      key: FeatureEventKey.MARK_AS_TEAM_MEMBER,
      type: EventType.FEATURE,
      properties: {
        path: route.path,
      },
    });

    doManualAction({
      loadingMessage: 'Profile is being updated',
      successMessage: 'Profile updated successfully',
      errorMessage: 'Something went wrong',
      actionFn: MemberService.update(command.member.id, {
        attributes: {
          ...command.member.attributes,
          isTeamMember: {
            default: command.value,
          },
        },
      }),
    }).then(() => {
      if (route.name === 'member') {
        memberStore.fetchMembers({ reload: true });
      } else {
        doFind({
          id: command.member.id,
          segments: [selectedProjectGroup.value?.id],
        });
      }
    });

    return;
  }

  // Mark as bot
  if (
    command.action === Actions.MARK_CONTACT_AS_BOT
    || command.action === Actions.UNMARK_CONTACT_AS_BOT
  ) {
    trackEvent({
      key: FeatureEventKey.MARK_AS_BOT,
      type: EventType.FEATURE,
      properties: {
        path: route.path,
      },
    });

    doManualAction({
      loadingMessage: 'Profile is being updated',
      successMessage: 'Profile updated successfully',
      errorMessage: 'Something went wrong',
      actionFn: MemberService.update(command.member.id, {
        attributes: {
          ...command.member.attributes,
          isBot: {
            default: command.action === Actions.MARK_CONTACT_AS_BOT,
          },
        },
      }),
    }).then(() => {
      if (route.name === 'member') {
        memberStore.fetchMembers({ reload: true });
      } else {
        doFind({
          id: command.member.id,
          segments: command.member.segments.map((s) => s.id),
        });
      }
    });

    return;
  }

  // Merge contact
  if (command.action === Actions.MERGE_CONTACT) {
    emit('closeDropdown');
    emit('merge');

    return;
  }

  // Merge contact
  if (command.action === Actions.UNMERGE_IDENTITY) {
    emit('closeDropdown');
    emit('unmerge');

    return;
  }

  if (command.action === Actions.FIND_GITHUB) {
    trackEvent({
      key: FeatureEventKey.FIND_IDENTITY,
      type: EventType.FEATURE,
    });

    emit('closeDropdown');
    emit('findGithub');

    return;
  }

  emit('closeDropdown');
};

const identities = computed(() => (props.member.identities || []).filter((i) => i.type !== 'email'));
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
