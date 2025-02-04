<template>
  <router-link
    class="text-gray-600 btn-link--md btn-link--secondary p-0 inline-flex items-center"
    :to="routeLocation"
  >
    <lf-icon name="chevron-left" :size="16" class="mr-2" />
    <span>
      <slot v-if="!backLink" />
      <span v-else>{{ previousRouteTitle }}</span>
    </span>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const props = defineProps<{
  defaultRoute: Record<string, unknown>
}>();

const router = useRouter();

const backLink = computed(() => {
  const { back } = window.history.state;
  if (!back || back.includes('/auth')) {
    return null;
  }
  return window.history.state.back;
});

const previousRouteTitle = computed(() => router.resolve(window.history.state.back)?.meta?.title);

const routeLocation = computed(() => {
  const fullUrl = backLink.value;

  if (!fullUrl) {
    return props.defaultRoute;
  }

  try {
    const url = new URL(fullUrl, window.location.origin);

    return {
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
      hash: url.hash,
    };
  } catch (e) {
    return props.defaultRoute;
  }
});

</script>
