<template>
  <div class="c-tab" :class="{ 'is-active': isActive }" @click="selectTab">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps<{
  name: string,
  modelValue: string;
  preserveQuery?: boolean,
}>();

const router = useRouter();
const route = useRoute();

const isActive = computed<boolean>(() => (route?.hash.substring(1) || props.modelValue) === props.name);

const selectTab = () => {
  router?.push(props.preserveQuery ? {
    ...route,
    hash: `#${props.name}`,
  } : {
    hash: `#${props.name}`,
  });
};
</script>

<script lang="ts">
export default {
  name: 'LfTab',
};
</script>
