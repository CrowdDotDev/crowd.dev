<template>
  <div v-if="props.contributor.activitySycning === MergeActionState.IN_PROGRESS" class="pt-12 flex flex-col items-center">
    <lf-icon name="loader-4-line" :size="40" class="text-gray-300 animate-spin" />
    <h6 class="text-center py-3">
      Syncing activities...
    </h6>
    <p class="text-center text-medium text-gray-500">
      Re-syncing all the activities as this organization was recently merged.<br>
      This process may take some minutes.
    </p>
  </div>
  <app-activity-timeline
    v-else
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
import LfIcon from '@/ui-kit/icon/Icon.vue';

const props = defineProps<{
  contributor: Contributor,
}>();

const route = useRoute();

const { subProjectId } = route.query;
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsActivities',
};
</script>
