<template>
  <div v-if="props.projects.length" class="flex flex-wrap gap-2">
    <el-popover
      placement="top"
      :width="250"
      trigger="hover"
    >
      <template #reference>
        <app-lf-pill color="bg-white text-gray-900" type="bordered">
          <div class="flex items-center gap-1">
            <lf-icon-old name="stack-line" />
            {{ projects.length }} {{ label }}
          </div>
        </app-lf-pill>
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
  <span v-else class="text-gray-500 text-sm">No projects</span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import LfIconOld from '@/ui-kit/icon/IconOld.vue';
import AppLfPill from '@/shared/pill/pill.vue';
import { Project } from '../../types/Segments';

const props = withDefaults(defineProps<{
  projects: Project[];
}>(), {
  projects: () => [],
});

const label = computed(() => (props.projects.length > 1 ? 'projects' : 'project'));
</script>

<script lang="ts">
export default {
  name: 'AppLfProjectColumn',
};
</script>
