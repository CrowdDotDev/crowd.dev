<template>
  <router-link
    class="text-gray-600 btn-link--md btn-link--secondary p-0 inline-flex items-center"
    :to="routeLocation"
  >
    <i class="ri-arrow-left-s-line mr-2" />
    <span>
      <slot v-if="!backLink" />
      <span v-else>{{ previousRouteTitle }}</span>
    </span>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps<{
  defaultRoute: Record<string, unknown>
}>();

const router = useRouter();

const backLink = computed(() => {
  console.log(window.history.state.back);
  console.log(router.resolve(window.history.state.back));
  return window.history.state.back;
});
const previousRouteTitle = computed(() => {
  console.log(window.history.state.back);
  return router.resolve(window.history.state.back)?.meta?.title;
});
const routeLocation = computed(() => (backLink.value ? {
  path: backLink.value,
} : props.defaultRoute));

</script>
