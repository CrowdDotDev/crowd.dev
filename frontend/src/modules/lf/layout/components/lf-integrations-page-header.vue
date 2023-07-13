<template>
  <router-link
    class="text-gray-600 btn-link--md btn-link--secondary p-0 inline-flex items-center pb-6"
    :to="{
      name: 'adminProjects',
      params: {
        id: route.params.grandparentId,
      },
    }"
  >
    <i class="ri-arrow-left-s-line mr-2" />
    <span>Manage Projects</span>
  </router-link>
  <div v-if="!loading" class="text-sm mb-2">
    <span class="text-brand-600">{{ subProject?.name }}</span>
  </div>
</template>

<script setup>
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const lsSegmentsStore = useLfSegmentsStore();
const { findSubProject } = lsSegmentsStore;

const route = useRoute();
const subProject = ref();
const loading = ref(true);

onMounted(async () => {
  try {
    const subProjectResponse = await findSubProject(route.params.id);

    subProject.value = subProjectResponse;

    loading.value = false;
  } catch (e) {
    loading.value = false;
  }
});
</script>

<script>
export default {
  name: 'AppLfIntegrationsPageHeader',
};
</script>
