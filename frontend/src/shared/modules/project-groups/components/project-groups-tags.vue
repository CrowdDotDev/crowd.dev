<template>
  <div v-if="projectGroups.length">
    <el-popover
      trigger="hover"
      placement="top"
      popper-class="!w-[260px] !max-w-[260px] !max-h-[400px] overflow-auto"
      :disabled="projectGroups.length === 1"
    >
      <template #reference>
        <el-tag type="info" size="small">
          {{ projectGroups.length > 1
            ? pluralize('project group', projectGroups.length, true)
            : projectGroups[0].name }}
        </el-tag>
      </template>

      <div>
        <div class="mb-2 text-gray-400 text-2xs">
          Project groups
        </div>
        <div class="flex flex-wrap items-center gap-1">
          <div v-for="projectGroup in projectGroups" :key="projectGroup.id">
            <el-tag type="info" size="small">
              {{ projectGroup.name }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { getProjectGroupsThroughSegments } from '@/utils/segments';
import { computed } from 'vue';
import pluralize from 'pluralize';

const props = defineProps<{
  segments: string[];
}>();

const projectGroups = computed(() => getProjectGroupsThroughSegments(props.segments));
</script>

<script lang="ts">
export default {
  name: 'LfProjectGroupsTags',
};
</script>
