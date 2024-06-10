<template>
  <router-link :to="routeLocation">
    {{ backLink }}
    <slot />
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

const props = withDefaults(defineProps<{
  to: Record<string, unknown>,
  projectGroup?: boolean,
}>(), {
  projectGroup: true,
});

const route = useRoute();

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

const backLink = computed(() => {
  const { back } = window.history.state;
  if (!back || back.includes('/auth')) {
    return null;
  }
  const [path] = back.split('?');
  if (path === route.path) {
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
