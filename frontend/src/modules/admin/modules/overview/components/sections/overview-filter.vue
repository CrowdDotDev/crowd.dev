<template>
  <div class="flex items-center">
    <app-lf-project-group-filter />
    <app-lf-project-filter :projects="projects" v-if="selectedProjectGroup && projects.length > 0" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppLfProjectGroupFilter from '../fragments/project-group-filter.vue';
import AppLfProjectFilter from '../fragments/project-filter.vue';
import { useOverviewStore } from '../../store/overview.store';
import { storeToRefs } from 'pinia';

const overviewStore = useOverviewStore();
const { selectedProjectGroup } = storeToRefs(overviewStore);

const projects = computed(() => {
  return selectedProjectGroup.value?.projects || [];
});
</script>

<script lang="ts">
export default {
  name: 'AppLfOverviewFilter',
};
</script>
