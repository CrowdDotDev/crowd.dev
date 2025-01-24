<template>
  <div class="member-sentiment">
    <el-tooltip
      v-if="
        member.averageSentiment
          && member.averageSentiment > 0
      "
      effect="dark"
      :content="`Avg sentiment score: ${member.averageSentiment}`"
      placement="top"
    >
      <i
        v-if="label === 'Positive'"
        class="ri-face-smile text-green-600 text-base"
      />
      <i
        v-else-if="label === 'Neutral'"
        class="ri-face-meh-line text-gray-400 text-base"
      />
      <i
        v-else
        class="ri-face-frown-line text-red-500 text-base"
      />
    </el-tooltip>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  member: {
    type: Object,
    default: () => {},
  },
});

const label = computed(() => {
  if (props.member.averageSentiment >= 67) {
    return 'Positive';
  } if (props.member.averageSentiment <= 33) {
    return 'Negative';
  }
  return 'Neutral';
});
</script>

<script>
export default {
  name: 'AppMemberSentiment',
};
</script>

<style lang="scss">
.member-sentiment,
.member-sentiment i {
  @apply inline-flex items-center;
}
</style>
