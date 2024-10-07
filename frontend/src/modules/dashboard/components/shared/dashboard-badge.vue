<template>
  <div
    class="py-0.5 px-1.5 rounded text-xs leading-5 font-medium flex"
    :class="[typeClass]"
  >
    <lf-icon
      v-if="type === 'success'"
      name="arrow-up"
      :size="16"
      class="text-green-700"
    />
    <lf-icon
      v-else-if="type === 'danger'"
      name="arrow-down"
      :size="16"
      class="text-red-700"
    />
    <slot />
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const props = defineProps({
  type: {
    required: false,
    type: String,
    default: 'success',
  },
});

const typeClass = computed(() => {
  if (props.type === 'success') {
    return 'bg-green-50 text-green-700';
  } if (props.type === 'danger') {
    return 'bg-red-50 text-red-700';
  }
  return 'bg-primary-100 text-primary-700';
});
</script>

<script>
export default {
  name: 'AppDashboardBadge',
};
</script>
