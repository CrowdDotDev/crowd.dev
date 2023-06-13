<template>
  <div
    :class="textClass"
  >
    {{ selectedProjectGroup?.name }}
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';

defineProps({
  textClass: {
    type: Object || String,
    default: null,
  },
});

const lsSegmentsStore = useLfSegmentsStore();
const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);
</script>

<script>
export default {
  name: 'AppLfPageHeader',
};
</script>
