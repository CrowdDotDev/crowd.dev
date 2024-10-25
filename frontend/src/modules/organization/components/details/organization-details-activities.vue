<template>
  <div v-if="props.organization.activitySycning?.state === MergeActionState.IN_PROGRESS" class="pt-12 flex flex-col items-center">
    <lf-icon-old name="loader-4-line" :size="40" class="text-gray-300 animate-spin" />
    <h6 class="text-center py-3">
      Syncing activities...
    </h6>
    <p class="text-center text-medium text-gray-500">
      Re-syncing all the activities as this organization was recently
      {{ props.organization.activitySycning?.operationType === 'merge' ? 'merged' : 'unmerged' }}.<br>
      This process may take some minutes.
    </p>
  </div>
  <div v-else-if="props.organization.activitySycning?.state === MergeActionState.ERROR" class="pt-12 flex flex-col items-center">
    <lf-icon-old name="error-warning-line" :size="40" class="text-gray-300" />
    <h6 class="text-center py-3">
      Error syncing activities
    </h6>
    <p class="text-center text-medium text-gray-500">
      An error occurred while syncing this organization activities.<br>
      Please contact our support team.
    </p>
  </div>
  <app-activity-timeline
    v-else
    :entity="{
      ...props.organization,
      organizations: [props.organization],
    }"
    entity-type="organization"
    :show-affiliations="true"
  />
</template>

<script setup lang="ts">
import { Organization } from '@/modules/organization/types/Organization';
import AppActivityTimeline from '@/modules/activity/components/activity-timeline.vue';
import LfIconOld from '@/ui-kit/icon/IconOld.vue';
import { MergeActionState } from '@/shared/modules/merge/types/MemberActions';

const props = defineProps<{
  organization: Organization,
}>();
</script>

<script lang="ts">
export default {
  name: 'LfOrganizationDetailsActivities',
};
</script>
