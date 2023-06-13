<template>
  <div
    class="activity-message"
    v-html="$sanitize(activityMessage)"
  />
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  activity: {
    type: Object,
    required: true,
  },
  type: {
    type: String,
    required: false,
    default: 'default',
  },
});

const activityMessage = computed(() => {
  if (
    props.activity?.display
    && props.type in props.activity.display
  ) {
    return props.activity.display[props.type];
  }
  return '';
});
</script>

<script>
export default {
  name: 'AppActivityMessage',
};
</script>

<style lang="scss">
.activity-message {
  * {
    @apply inline-block align-bottom;
  }

  a,
  span {
    @apply text-brand-500;

    &.gray {
      @apply text-gray-500;
    }

    &:not(.notruncate) {
      @apply truncate max-w-2xs;
    }
  }

  img {
    @apply h-4 w-auto;
  }
}
</style>
