<template>
  <div v-if="!loading" class="text-sm mb-4">
    <span class="text-gray-500">
      <span>Admin Panel</span>
      <span> > {{ projectGroup?.name }}</span>
      <span class="text-brand-500"> > <router-link
        :to="{
          name: 'adminProjects',
          params: {
            id: route.params.grandparentId,
          },
        }"
      >
        <span>{{ project?.name }} (Project)</span>
      </router-link></span>
    </span>
  </div>
</template>

<script setup>
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const lsSegmentsStore = useLfSegmentsStore();
const { findProjectGroup, findProject } = lsSegmentsStore;

const route = useRoute();
const projectGroup = ref();
const project = ref();
const loading = ref(true);

onMounted(async () => {
  try {
    const projectGroupResponse = await findProjectGroup(route.params.grandparentId);
    const projectResponse = await findProject(route.params.parentId);

    projectGroup.value = projectGroupResponse;
    project.value = projectResponse;

    loading.value = false;
  } catch (e) {
    loading.value = false;
  }
});
</script>

<script>
export default {
  name: 'AppLfPageHeaderBreadcrumbs',
};
</script>
