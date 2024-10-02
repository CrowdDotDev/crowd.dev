<template>
  <div>
    <div v-for="project in props.projects" :key="project.id" class="mb-4 flex items-center justify-between">
      <div class="flex items-center">
        <el-checkbox v-model="project.selected" @change="updateProject(project)">
          {{ project.name }}
        </el-checkbox>
      </div>
      <div class="flex items-center">
        <el-select
          v-model="project.segmentId"
          :placeholder="$t('integrations.gitlab.settings.selectSegment')"
          class="mr-2"
          @change="updateProject(project)"
        >
          <el-option
            v-for="segment in props.segments"
            :key="segment.id"
            :label="segment.name"
            :value="segment.id"
          />
        </el-select>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  projects: {
    type: Array,
    default: () => [],
  },
  segments: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:project']);

const updateProject = (project) => {
  emit('update:project', project);
};
</script>
