<template>
  <template v-if="hasPermission(LfPermission.memberEdit)">
    <router-link
      :to="{
        name: 'memberEdit',
        params: {
          id: props.contributor.id,
        },
      }"
    >
      <lf-dropdown-item>
        <lf-icon name="pencil-line" />
        Edit contributor
      </lf-dropdown-item>
    </router-link>
    <lf-dropdown-separator />
  </template>
  <lf-dropdown-item :disabled="!!props.contributor.username?.github" @click="emit('findGithub')">
    <lf-icon name="github-fill" />
    Find GitHub
  </lf-dropdown-item>
  <lf-dropdown-item @click="markTeamMember(!isTeamContributor(props.contributor))">
    <lf-icon name="team-line" />
    {{ isTeamContributor(props.contributor) ? 'Unmark' : 'Mark' }} as team contributor
  </lf-dropdown-item>
  <lf-dropdown-item @click="markBot(!isBot(props.contributor))">
    <lf-icon name="robot-line" />
    {{ isBot(props.contributor) ? 'Unmark' : 'Mark' }} as bot
  </lf-dropdown-item>
  <template v-if="hasPermission(LfPermission.memberDestroy)">
    <lf-dropdown-separator />
    <lf-dropdown-item type="danger" @click="deleteContributor()">
      <lf-icon name="delete-bin-6-line" />
      Delete contributor
    </lf-dropdown-item>
  </template>
</template>

<script setup lang="ts">
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import LfDropdownSeparator from '@/ui-kit/dropdown/DropdownSeparator.vue';
import { Contributor } from '@/modules/contributor/types/Contributor';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { useRoute, useRouter } from 'vue-router';
import { MemberService } from '@/modules/member/member-service';
import { doManualAction } from '@/shared/helpers/manualAction.helpers';
import useContributorHelpers from '@/modules/contributor/helpers/contributor.helpers';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';

const props = defineProps<{
  contributor: Contributor,
}>();

const emit = defineEmits<{(e: 'reload'): any, (e: 'findGithub'): any}>();

const route = useRoute();
const router = useRouter();
const { hasPermission } = usePermissions();
const { trackEvent } = useProductTracking();
const { isTeamContributor, isBot } = useContributorHelpers();

const markTeamMember = (teamMember: boolean) => {
  trackEvent({
    key: FeatureEventKey.MARK_AS_TEAM_CONTRIBUTOR,
    type: EventType.FEATURE,
    properties: {
      path: route.path,
      teamMember,
    },
  });

  doManualAction({
    loadingMessage: 'Contributor is being updated',
    successMessage: 'Contributor updated successfully',
    errorMessage: 'Something went wrong',
    actionFn: MemberService.update(props.contributor.id, {
      attributes: {
        ...props.contributor.attributes,
        isTeamMember: {
          default: teamMember,
        },
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
    loadingMessage: 'Contributor is being updated',
    successMessage: 'Contributor updated successfully',
    errorMessage: 'Something went wrong',
    actionFn: MemberService.update(props.contributor.id, {
      attributes: {
        ...props.contributor.attributes,
        isBot: {
          default: bot,
        },
      },
    }),
  }).then(() => {
    emit('reload');
  });
};

const deleteContributor = () => {
  ConfirmDialog({
    type: 'danger',
    title: 'Delete contributor',
    message: "Are you sure you want to proceed? You can't undo this action",
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel',
    icon: 'ri-delete-bin-line',
  }).then(() => {
    trackEvent({
      key: FeatureEventKey.DELETE_CONTRIBUTOR,
      type: EventType.FEATURE,
      properties: {
        path: route.path,
      },
    });

    doManualAction({
      loadingMessage: 'Contributor is being deleted',
      successMessage: 'Contributor successfully deleted',
      errorMessage: 'Something went wrong',
      actionFn: MemberService.destroyAll([props.contributor.id]),
    }).then(() => {
      router.push({
        path: '/contributors',
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
