<template>
  <div
    class="py-0.5 px-1.5 rounded text-xs leading-5 font-medium flex"
    :class="[typeClass]"
  >
    <i
      v-if="type === 'success'"
      class="ri-arrow-up-line text-base text-green-700 mr-1 flex items-center"
    ></i>
    <i
      v-else-if="type === 'danger'"
      class="ri-arrow-down-line text-base text-red-700 mr-1 flex items-center"
    ></i>
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'AppDashboardBadge'
}
</script>

<script setup>
import { defineProps, computed } from 'vue'

const props = defineProps({
  type: {
    required: false,
    type: String,
    default: 'success'
  }
})

const typeClass = computed(() => {
  if (props.type === 'success') {
    return 'bg-green-50 text-green-700'
  } else if (props.type === 'danger') {
    return 'bg-red-50 text-red-700'
  } else {
    return 'bg-blue-100 text-blue-700'
  }
})
</script>
