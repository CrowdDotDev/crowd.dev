<template>
  <el-tooltip
    v-if="sentiment && sentiment > 0"
    effect="dark"
    :content="`Sentiment score: ${sentiment}`"
    placement="top"
  >
    <i
      v-if="label === 'Positive'"
      class="ri-emotion-happy-line text-green-600 text-sm"
    />
    <i
      v-else-if="label === 'Neutral'"
      class="ri-emotion-normal-line text-gray-400 text-sm"
    />
    <i
      v-else
      class="ri-emotion-unhappy-line text-red-500 text-sm"
    />
  </el-tooltip>
</template>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  sentiment: {
    type: Number,
    required: false,
    default: 0,
  },
});

const label = computed(() => {
  if (props.sentiment >= 67) {
    return 'Positive';
  } if (props.sentiment <= 33) {
    return 'Negative';
  }
  return 'Neutral';
});
</script>

<script>
export default {
  name: 'AppActivitySentiment',
};
</script>
