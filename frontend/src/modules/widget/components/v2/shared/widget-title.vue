<template>
  <div class="flex gap-2">
    <div
      class="font-medium text-gray-900"
      :class="`${textSize}`"
    >
      {{ title }}
    </div>
    <el-tooltip
      v-if="description"
      popper-class="w-48"
      effect="dark"
      :content="description"
      placement="top"
    >
      <i class="ri-question-line text-base text-gray-400" />
    </el-tooltip>
  </div>
</template>

<script>
export default {
  name: 'AppWidgetTitle'
}
</script>

<script setup>
import { defineProps } from 'vue'

defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: null
  },
  textSize: {
    type: String,
    default: 'text-base'
  }
})
</script>
