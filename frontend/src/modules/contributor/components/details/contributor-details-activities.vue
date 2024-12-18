<template>
  <div v-if="props.contributor.activitySycning?.state === MergeActionState.IN_PROGRESS" class="pt-12 flex flex-col items-center">
    <lf-icon-old name="loader-4-line" :size="40" class="text-gray-300 animate-spin" />
    <h6 class="text-center py-3">
      Syncing activities...
    </h6>
    <p class="text-center text-medium text-gray-500">
      Re-syncing all the activities as this person was recently
      {{ props.contributor.activitySycning?.operationType === 'merge' ? 'merged' : 'unmerged' }}.<br>
      This process may take some minutes.
    </p>
  </div>
  <div v-else-if="props.contributor.activitySycning?.state === MergeActionState.ERROR" class="pt-12 flex flex-col items-center">
    <lf-icon-old name="error-warning-line" :size="40" class="text-gray-300" />
    <h6 class="text-center py-3">
      Error syncing activities
    </h6>
    <p class="text-center text-medium text-gray-500">
      An error occurred while syncing this profile activities.<br>
      Please contact our support team.
    </p>
  </div>
  <div v-else-if="masked">
    <div class="flex items-center bg-yellow-50 p-2 mb-6 text-small rounded-md border border-yellow-300 text-yellow-600">
      <lf-icon name="circle-exclamation" type="regular" class="mr-2" /> This person's activities are not shown because of the GDPR.
    </div>
  </div>
  <app-activity-timeline
    v-else
    ref="timeline"
    :entity="props.contributor"
    entity-type="member"
    :show-affiliations="true"
    :selected-segment="subProjectId || null"
    class="max-w-full"
  />
</template>

<script setup lang="ts">
import { Contributor } from '@/modules/contributor/types/Contributor';
import AppActivityTimeline from '@/modules/activity/components/activity-timeline.vue';
import { useRoute } from 'vue-router';
import { MergeActionState } from '@/shared/modules/merge/types/MemberActions';
import LfIconOld from '@/ui-kit/icon/IconOld.vue';
import useContributorHelpers from '@/modules/contributor/helpers/contributor.helpers';
import { computed, ref } from 'vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const props = defineProps<{
  contributor: Contributor,
}>();

const route = useRoute();

const { isMasked } = useContributorHelpers();

const timeline = ref(null);

const { subProjectId } = route.query;

const masked = computed(() => isMasked(props.contributor));

const loadMore = () => {
  timeline.value.fetchActivities();
};

defineExpose({
  loadMore,
});
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsActivities',
};
</script>
