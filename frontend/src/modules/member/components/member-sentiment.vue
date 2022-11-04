<template>
  <div class="member-sentiment">
    <el-tooltip
      v-if="
        member.averageSentiment &&
        member.averageSentiment > 0
      "
      effect="dark"
      :content="`Avg sentiment score: ${member.averageSentiment}`"
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
  </div>
</template>
<script>
export default {
  name: 'AppMemberSentiment'
}
</script>

<script setup>
import { defineProps, computed } from 'vue'

const props = defineProps({
  member: {
    type: Object,
    default: () => {}
  }
})

const label = computed(() => {
  if (props.member.averageSentiment >= 67) {
    return 'Positive'
  } else if (props.member.averageSentiment <= 33) {
    return 'Negative'
  } else {
    return 'Neutral'
  }
})
</script>

<style lang="scss">
.member-sentiment,
.member-sentiment i {
  @apply inline-flex items-center;
}
</style>
