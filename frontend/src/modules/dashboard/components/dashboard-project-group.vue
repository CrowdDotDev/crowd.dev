<template>
  <img
    v-if="isUrl(selectedProjectGroup.url)"
    :src="selectedProjectGroup.url"
    alt="Project group logo"
    class="h-6 mb-3"
  />
  <div class="text-base font-semibold text-gray-900 mb-8">
    {{ selectedProjectGroup.name }}
  </div>

  <div class="py-3 border-b border-gray-200">
    <div class="text-2xs text-gray-400 mb-0.5">
      Projects
    </div>
    <div class="text-xs text-gray-900">
      {{ selectedProjectGroup.projects.length }}
    </div>
  </div>

  <div class="py-3">
    <div class="text-2xs text-gray-400 mb-0.5">
      Contributors
    </div>
    <div class="text-xs text-gray-900">
      0
    </div>
  </div>

  <div class="mt-8">
    <el-button
      class="btn btn--md btn--bordered btn--full mb-4"
      @click="isDrawerOpen = true"
    >
      Projects list
    </el-button>
    <router-link
      :to="{
        name: 'adminProjects',
        params: {
          id: selectedProjectGroup.id,
        },
      }"
    >
      <el-button class="btn btn--md btn--secondary btn--full">
        <i class="ri-external-link-line" />
        <span>Settings</span>
      </el-button>
    </router-link>
  </div>

  <app-dashboard-project-group-drawer
    v-if="isDrawerOpen"
    v-model:is-visible="isDrawerOpen"
    :project-group="selectedProjectGroup"
  />
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import isUrl from '@/utils/isUrl';
import { ref } from 'vue';
import AppDashboardProjectGroupDrawer from './dashboard-project-group-drawer.vue';

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const isDrawerOpen = ref(false);

</script>

<script>
export default {
  name: 'AppDashboardProjectGroup',
};
</script>
