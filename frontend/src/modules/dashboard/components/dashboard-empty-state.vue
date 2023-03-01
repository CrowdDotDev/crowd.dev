<template>
  <div class="flex items-center justify-center">
    <div
      v-if="props.iconClass"
      class="text-3xl text-gray-300 mr-4 h-10 flex items-center"
      :class="props.iconClass"
    ></div>
    <p
      class="text-xs leading-5 text-center italic text-gray-400"
    >
      <slot />
    </p>
  </div>
</template>

<script>
export default {
  name: 'AppDashboardEmptyState'
}
</script>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  iconClass: {
    type: String,
    required: false,
    default: ''
  }
})
</script>
