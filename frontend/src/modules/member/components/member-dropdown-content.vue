<template>
  <template v-if="identities.length > 1 && !props.hideUnmerge">
    <button
      class="h-10 el-dropdown-menu__item w-full"
      :disabled="isEditLockedForSampleData"
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
    v-if="!props.hideEdit"
    :to="{
      name: 'memberEdit',
      params: {
        id: member.id,
      },
    }"
    :class="{
      'pointer-events-none cursor-not-allowed': isEditLockedForSampleData,
    }"
  >
    <button
      class="h-10 el-dropdown-menu__item w-full mb-1"
      :disabled="isEditLockedForSampleData"
      type="button"
    >
      <i class="ri-pencil-line text-base mr-2" />
      <span class="text-xs">Edit contributor</span>
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

  <el-tooltip
    v-if="!props.hideMerge"
    content="Coming soon"
    placement="top"
    :disabled="hasPermissionsToMerge"
  >
    <button
      class="h-10 el-dropdown-menu__item w-full"
      :disabled="isEditLockedForSampleData || !hasPermissionsToMerge"
      type="button"
      @click="
        handleCommand({
          action: Actions.MERGE_CONTACT,
          member,
        })
      "
    >
      <i class="ri-group-line text-base mr-2" /><span class="text-xs">Merge contributor</span>
    </button>
  </el-tooltip>

  <el-tooltip
    placement="top"
    content="Mark as team contact if they belong to your own organization"
    popper-class="max-w-[260px]"
  >
    <span>
      <button
        v-if="!member.attributes?.isTeamMember?.default"
        class="h-10 el-dropdown-menu__item w-full"
        :disabled="isEditLockedForSampleData"
        type="button"
        @click="
          handleCommand({
            action: Actions.MARK_CONTACT_AS_TEAM_CONTACT,
            member,
            value: true,
          })
        "
      >
        <i class="ri-bookmark-line text-base mr-2" /><span class="text-xs">Mark as team contributor</span>
      </button>
    </span>
  </el-tooltip>
  <button
    v-if="member.attributes?.isTeamMember?.default"
    class="h-10 el-dropdown-menu__item w-full"
    :disabled="isEditLockedForSampleData"
    type="button"
    @click="
      handleCommand({
        action: Actions.MARK_CONTACT_AS_TEAM_CONTACT,
        member,
        value: false,
      })
    "
  >
    <i class="ri-bookmark-2-line text-base mr-2" /><span class="text-xs">Unmark as team contributor</span>
  </button>
  <button
    v-if="!member.attributes.isBot?.default"
    class="h-10 el-dropdown-menu__item w-full"
    :disabled="isEditLockedForSampleData"
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
    :disabled="isEditLockedForSampleData"
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
  <el-divider class="border-gray-200" />
  <button
    class="h-10 el-dropdown-menu__item w-full"
    :disabled="isDeleteLockedForSampleData"
    type="button"
    @click="
      handleCommand({
        action: Actions.DELETE_CONTACT,
        member,
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
    >Delete contributor</span>
  </button>
</template>

<script setup lang="ts">
import { mapActions } from '@/shared/vuex/vuex.helpers';
import { MemberService } from '@/modules/member/member-service';
import Message from '@/shared/message/message';
import { MemberPermissions } from '@/modules/member/member-permissions';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import { useMemberStore } from '@/modules/member/store/pinia';
import {
  FeatureFlag, FEATURE_FLAGS,
} from '@/utils/featureFlag';
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { Member } from '../types/Member';

enum Actions {
  DELETE_CONTACT = 'deleteContact',
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

const authStore = useAuthStore();
const { user, tenant } = storeToRefs(authStore);
const { doFind } = mapActions('member');

const { selectedProjectGroup } = storeToRefs(useLfSegmentsStore());

const memberStore = useMemberStore();

const isEditLockedForSampleData = computed(
  () => new MemberPermissions(tenant.value, user.value)
    .editLockedForSampleData,
);

const isDeleteLockedForSampleData = computed(
  () => new MemberPermissions(tenant.value, user.value)
    .destroyLockedForSampleData,
);

const hasPermissionsToMerge = computed(() => new MemberPermissions(
  tenant.value,
  user.value,
)?.mergeMembers);

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
      title: 'Delete contributor',
      message: "Are you sure you want to proceed? You can't undo this action",
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      icon: 'ri-delete-bin-line',
    }).then(() => {
      doManualAction({
        loadingMessage: 'Contributor is being deleted',
        successMessage: 'Contributor successfully deleted',
        errorMessage: 'Something went wrong',
        actionFn: MemberService.destroyAll([command.member.id]),
      }).then(() => {
        memberStore.fetchMembers({ reload: true });
      });
    });

    return;
  }

  // Mark as team contact
  if (command.action === Actions.MARK_CONTACT_AS_TEAM_CONTACT) {
    doManualAction({
      loadingMessage: 'Contributor is being updated',
      successMessage: 'Contributor updated successfully',
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
    doManualAction({
      loadingMessage: 'Contributor is being updated',
      successMessage: 'Contributor updated successfully',
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
