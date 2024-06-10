<template>
  <app-activity-timeline
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
