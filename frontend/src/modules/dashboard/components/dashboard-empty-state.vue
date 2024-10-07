<template>
  <div class="flex items-center justify-center">
    <lf-icon
      v-if="props.icon"
      :name="props.icon"
      class="text-gray-300 mr-4"
      :size="40"
    />
    <p
      class="text-xs leading-5 text-center italic text-gray-400"
    >
      <slot />
    </p>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const props = defineProps({
  icon: {
    type: String,
    required: false,
    default: '',
  },
});
</script>

<script>
export default {
  name: 'AppDashboardEmptyState',
};
</script>
