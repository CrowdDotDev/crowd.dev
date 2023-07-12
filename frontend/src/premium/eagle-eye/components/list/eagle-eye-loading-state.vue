<template>
  <div class="flex flex-col items-center">
    <app-eagle-eye-loading-card
      size="small"
      class="mt-30 w-64"
    />
    <h5 class="mt-8">
      Loading results...
    </h5>
    <div
      v-if="showLongerLoading && showDescription"
      class="text-gray-600 text-sm mt-4"
    >
      Generating your Community Lens feed can take up to 10
      seconds.
    </div>
  </div>
</template>

<script setup>
import {
  onMounted,
  onUnmounted,
  ref,
  defineProps,
} from 'vue';
import AppEagleEyeLoadingCard from '@/premium/eagle-eye/components/list/eagle-eye-loading-card.vue';

const showLongerLoading = ref(false);
const timeout = ref();

const props = defineProps({
  showDescription: {
    type: Boolean,
    default: true,
  },
});

onMounted(() => {
  if (props.showDescription) {
    timeout.value = setTimeout(() => {
      showLongerLoading.value = true;
    }, 2000);
  }
});

onUnmounted(() => {
  if (props.showDescription) {
    clearTimeout(timeout.value);
  }
});
</script>
