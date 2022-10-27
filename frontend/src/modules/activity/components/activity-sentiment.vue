<template>
  <el-tooltip
    v-if="sentiment && sentiment > 0"
    effect="dark"
    :content="`Sentiment score: ${sentiment}`"
    placement="top"
  >
    <i
      v-if="label === 'Positive'"
      class="ri-emotion-happy-line text-green-600 text-base"
    ></i>
    <i
      v-else-if="label === 'Neutral'"
      class="ri-emotion-normal-line text-gray-400 text-base"
    ></i>
    <i
      v-else
      class="ri-emotion-unhappy-line text-red-500 text-base"
    ></i>
  </el-tooltip>
</template>
<script>
export default {
  name: 'AppActivitySentiment'
}
</script>

<script setup>
import { defineProps, computed } from 'vue'

const props = defineProps({
  sentiment: {
    type: Number,
    required: true
  }
})

const label = computed(() => {
  if (props.sentiment >= 67) {
    return 'Positive'
  } else if (props.sentiment <= 33) {
    return 'Negative'
  } else {
    return 'Neutral'
  }
})
</script>
