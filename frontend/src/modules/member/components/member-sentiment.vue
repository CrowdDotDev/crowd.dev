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
      <lf-icon
        v-if="label === 'Positive'"
        name="face-smile"
        class="text-green-600"
      />
      <lf-icon
        v-else-if="label === 'Neutral'"
        name="face-meh"
        class="text-gray-400"
      />
      <lf-icon
        v-else
        name="face-frown"
        class="text-red-500"
      />
    </el-tooltip>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';

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
