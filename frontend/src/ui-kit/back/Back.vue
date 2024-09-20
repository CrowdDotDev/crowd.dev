<template>
  <router-link :to="routeLocation">
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
  const [path, query] = back.split('?');
  const backUrl = new URL(path + (query ? `?${query}` : ''), window.location.origin);
  const currentUrl = new URL(route.fullPath, window.location.origin);
  if (backUrl.pathname === currentUrl.pathname && backUrl.hash === currentUrl.hash) {
    return null;
  }
  return window.history.state.back;
});

const routeLocation = computed(() => {
  const fullUrl = backLink.value;

  if (!fullUrl) {
    return {
      ...props.to,
      query: {
        projectGroup: props.projectGroup ? selectedProjectGroup.value?.id : undefined,
        ...(props.to.query || {}),
      },
    };
  }

  try {
    const url = new URL(fullUrl, window.location.origin);
    return {
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
      hash: url.hash,
    };
  } catch (e) {
    return {
      ...props.to,
      query: {
        projectGroup: props.projectGroup ? selectedProjectGroup.value?.id : undefined,
        ...(props.to.query || {}),
      },
    };
  }
});

</script>

<script lang="ts">
export default {
  name: 'LfBack',
};
</script>
