<template>
  <app-activity-timeline
    :entity="props.contributor"
    entity-type="member"
    :show-affiliations="true"
    class="max-w-full"
  />
</template>

<script setup lang="ts">
import { Contributor } from '@/modules/contributor/types/Contributor';
import AppActivityTimeline from '@/modules/activity/components/activity-timeline.vue';

const props = defineProps<{
  contributor: Contributor,
}>();
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsActivities',
};
</script>
