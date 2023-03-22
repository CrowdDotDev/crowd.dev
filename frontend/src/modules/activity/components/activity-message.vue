<template>
  <div
    class="activity-message"
    v-html="$sanitize(activityMessage)"
  ></div>
</template>

<script>
export default {
  name: 'AppActivityMessage'
}
</script>

<script setup>
import { defineProps, computed } from 'vue'

const props = defineProps({
  activity: {
    type: Object,
    required: true
  },
  type: {
    type: String,
    required: false,
    default: 'default'
  }
})

const activityMessage = computed(() => {
  if (
    props.activity?.display &&
    props.type in props.activity.display
  ) {
    return props.activity.display[props.type]
  }
  return ''
})
</script>

<style lang="scss">
.activity-message {
  @apply text-xs leading-4;

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

  &:not(span, a) {
    @apply inline-block align-middle;
  }

  img {
    @apply h-4 w-auto;
  }
}
</style>
