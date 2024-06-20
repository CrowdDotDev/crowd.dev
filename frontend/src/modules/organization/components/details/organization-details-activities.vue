<template>
  <app-activity-timeline
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

const props = defineProps<{
  organization: Organization,
}>();
</script>

<script lang="ts">
export default {
  name: 'LfOrganizationDetailsActivities',
};
</script>
