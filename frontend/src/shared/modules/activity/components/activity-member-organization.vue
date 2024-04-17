<template>
  <router-link
    v-if="organization"
    :to="{
      name: 'organizationView',
      params: {
        id: organization.id,
      },
      query: {
        projectGroup: selectedProjectGroup?.id,
        segmentId,
      },
    }"
    class="group hover:cursor-pointer"
  >
    <div
      class="flex items-center gap-1.5"
      :class="{
        'pl-0.5': organization.logo,
        'pl-1.5': !organization.logo,
      }"
    >
      <img
        v-if="organization.logo"
        class="w-4 h-4 border border-gray-100 rounded-[4px]"
        :src="organization.logo"
        :alt="`${organization.displayName} logo`"
      />
      <span
        class="text-gray-500 group-hover:decoration-gray-900 transition text-xs underline decoration-dashed underline-offset-4 decoration-gray-400"
      >{{ organization.displayName }}</span>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { Organization } from '@/modules/organization/types/Organization';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { useActivityStore } from '@/modules/activity/store/pinia';

defineProps<{
  organization: Organization;
}>();

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const activityStore = useActivityStore();
const { filters } = storeToRefs(activityStore);

const segmentId = computed(() => {
  if (!filters.value.projects) {
    return selectedProjectGroup.value?.id;
  }

  return filters.value.projects.value[0];
});
</script>
