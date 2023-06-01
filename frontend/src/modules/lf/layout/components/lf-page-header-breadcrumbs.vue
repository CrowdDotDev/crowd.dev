<template>
  <div v-if="subproject" class="text-sm mb-4">
    <span class="text-gray-500">
      <span>Admin Panel</span>
      <span v-if="subproject.grandparentName"> > {{ subproject.grandparentName }}</span>
      <span v-if="subproject.parentName"> > {{ subproject.parentName }}</span>
      <span v-if="subproject.name"> > </span>
    </span>
    <span class="text-brand-500">{{ subproject.name }} (Sub-project) </span>
  </div>
</template>

<script setup>
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const lsSegmentsStore = useLfSegmentsStore();
const { findSubProject } = lsSegmentsStore;

const route = useRoute();
const subproject = ref();

onMounted(() => {
  findSubProject(route.params.id).then((response) => {
    subproject.value = response;
  });
});
</script>

<script>
export default {
  name: 'AppLfPageHeaderBreadcrumbs',
};
</script>
