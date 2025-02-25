<template>
  <div v-if="props.projects.length" class="flex flex-wrap gap-2">
    <el-popover
      placement="top"
      :width="250"
      trigger="hover"
    >
      <template #reference>
        <app-lf-project-count :title="props.title" :icon="props.icon" :count="projects.length" />
      </template>
      <template #default>
        <div class="flex flex-wrap gap-1 overflow-hidden">
          <div
            v-for="project of projects"
            :key="project.id"
            class="truncate"
          >
            <div class="badge--border !block badge--gray-light h-6 text-xs" @click.prevent>
              {{ project.name }}
            </div>
          </div>
        </div>
      </template>
    </el-popover>
  </div>
  <span v-else class="text-gray-500 text-sm">No {{ props.title }}</span>
</template>

<script lang="ts" setup>
import AppLfProjectCount from './lf-project-count.vue';

const props = withDefaults(defineProps<{
  projects: {
    id: string;
    name: string;
  }[];
  icon?: string;
  title?: string;
}>(), {
  projects: () => [],
  title: () => 'Projects',
  icon: () => 'layer-group',
});
</script>

<script lang="ts">
export default {
  name: 'AppLfProjectColumn',
};
</script>
