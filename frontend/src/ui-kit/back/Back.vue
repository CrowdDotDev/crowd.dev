<template>
  <router-link :to="routeLocation">
    <slot />
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { storeToRefs } from 'pinia';

const props = withDefaults(defineProps<{
  to: Record<string, unknown>,
  projectGroup?: boolean,
}>(), {
  projectGroup: true,
});

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const backLink = computed(() => {
  const { back } = window.history.state;
  if (!back || back.includes('/auth')) {
    return null;
  }
  return window.history.state.back;
});

const routeLocation = computed<any>(() => (backLink.value ? {
  path: backLink.value,
} : {
  ...props.to,
  query: {
    projectGroup: props.projectGroup ? selectedProjectGroup.value?.id : undefined,
    ...(props.to.query || {}),
  },
}
));

</script>

<script lang="ts">
export default {
  name: 'LfBack',
};
</script>
