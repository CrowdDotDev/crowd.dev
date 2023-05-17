<template>
  <app-page-wrapper>
    <h4 class="text-gray-900 py-6">
      Admin panel
    </h4>

    <app-empty-state-cta
      v-if="!projectGroups.length"
      class="mt-20"
      icon="ri-folder-5-line"
      title="No project groups yet"
      description="Create your first project group and start integrating your projects"
      cta-btn="Add project group"
      @cta-click="onCtaClick"
    />

    <app-lf-project-group-form
      v-model="isFormDrawerOpen"
    />
  </app-page-wrapper>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import AppLfProjectGroupForm from '@/modules/lf/segments/components/form/lf-project-group-form.vue';

const lsSegmentsStore = useLfSegmentsStore();
const { projectGroups } = storeToRefs(lsSegmentsStore);

const isFormDrawerOpen = ref(false);

const onCtaClick = () => {
  isFormDrawerOpen.value = true;
};
</script>

<script>
export default {
  name: 'AppLfProjectGroupsPage',
};
</script>
