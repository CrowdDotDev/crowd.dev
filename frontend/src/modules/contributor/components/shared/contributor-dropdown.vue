<template>
  <lf-dropdown-item
    v-if="!isMasked(props.contributor) && (props.contributor.identities || []).length > 1
      && hasPermission(LfPermission.memberEdit)"
    @click="unmerge = props.contributor"
  >
    <lf-icon-old name="link-unlink" />
    Unmerge profile
  </lf-dropdown-item>
  <lf-dropdown-item v-if="hasPermission(LfPermission.memberEdit) && !hasGithubIdentity" :disabled="!!props.contributor.username?.github" @click="emit('findGithub')">
    <lf-icon-old name="github-fill" />
    Find GitHub
  </lf-dropdown-item>
  <lf-dropdown-item v-if="hasPermission(LfPermission.memberEdit)" @click="markTeamMember(!isTeamMember(props.contributor))">
    <lf-icon-old name="team-line" />
    {{ isTeamMember(props.contributor) ? 'Unmark' : 'Mark' }} as team member
  </lf-dropdown-item>
  <lf-dropdown-item v-if="hasPermission(LfPermission.memberEdit)" @click="markBot(!isBot(props.contributor))">
    <lf-icon-old name="robot-line" />
    {{ isBot(props.contributor) ? 'Unmark' : 'Mark' }} as bot
  </lf-dropdown-item>
  <template v-if="hasPermission(LfPermission.memberDestroy)">
    <lf-dropdown-separator />
    <lf-dropdown-item type="danger" @click="deleteContributor()">
      <lf-icon-old name="delete-bin-6-line" />
      Delete profile
    </lf-dropdown-item>
  </template>

  <app-member-unmerge-dialog
    v-if="unmerge"
    v-model="unmerge"
  />
</template>

<script setup lang="ts">
import LfIconOld from '@/ui-kit/icon/IconOld.vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import LfDropdownSeparator from '@/ui-kit/dropdown/DropdownSeparator.vue';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { useRoute, useRouter } from 'vue-router';
import { MemberService } from '@/modules/member/member-service';
import { doManualAction } from '@/shared/helpers/manualAction.helpers';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import AppMemberUnmergeDialog from '@/modules/member/components/member-unmerge-dialog.vue';
import { computed, ref } from 'vue';
import useContributorHelpers from '@/modules/contributor/helpers/contributor.helpers';
import { Contributor } from '@/modules/contributor/types/Contributor';
import { useContributorStore } from '@/modules/contributor/store/contributor.store';

const props = defineProps<{
  contributor: Contributor,
}>();

const emit = defineEmits<{(e: 'reload'): any, (e: 'findGithub'): any}>();

const route = useRoute();
const router = useRouter();
const { hasPermission } = usePermissions();
const { trackEvent } = useProductTracking();
const { isTeamMember, isBot, isMasked } = useContributorHelpers();
const { updateContributorAttributes } = useContributorStore();

const unmerge = ref<Contributor | null>(null);
const hasGithubIdentity = computed(() => (props.contributor.identities?.some((identity) => identity.platform === 'github')));

const markTeamMember = (teamMember: boolean) => {
  trackEvent({
    key: FeatureEventKey.MARK_AS_TEAM_MEMBER,
    type: EventType.FEATURE,
    properties: {
      path: route.path,
      teamMember,
    },
  });

  doManualAction({
    loadingMessage: 'Profile is being updated',
    successMessage: 'Profile updated successfully',
    errorMessage: 'Something went wrong',
    actionFn: updateContributorAttributes(props.contributor.id, {
      ...props.contributor.attributes,
      isTeamMember: {
        default: teamMember,
      },
    }),
  }).then(() => {
    emit('reload');
  });
};
const markBot = (bot: boolean) => {
  trackEvent({
    key: FeatureEventKey.MARK_AS_BOT,
    type: EventType.FEATURE,
    properties: {
      path: route.path,
      bot,
    },
  });

  doManualAction({
    loadingMessage: 'Profile is being updated',
    successMessage: 'Profile updated successfully',
    errorMessage: 'Something went wrong',
    actionFn: updateContributorAttributes(props.contributor.id, {
      ...props.contributor.attributes,
      isBot: {
        default: bot,
      },
    }),
  }).then(() => {
    emit('reload');
  });
};

const deleteContributor = () => {
  ConfirmDialog({
    type: 'danger',
    title: 'Delete profile',
    message: "Are you sure you want to proceed? You can't undo this action",
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel',
    icon: 'fa-light fa-trash-can',
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
      actionFn: MemberService.destroyAll([props.contributor.id]),
    }).then(() => {
      router.push({
        path: '/people',
        query: {
          projectGroup: route.query.projectGroup,
        },
      });
      emit('reload');
    });
  });
};

</script>

<script lang="ts">
export default {
  name: 'LfContributorDropdown',
};
</script>
