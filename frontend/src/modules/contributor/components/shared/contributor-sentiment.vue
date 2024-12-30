<template>
  <lf-tooltip v-if="data" :content="`Score: ${props.contributor.averageSentiment}`">
    <div class="flex items-center gap-1.5" :class="data.class">
      <lf-icon-old
        :size="16"
        :name="data.icon"
      />
      <p class="text-small font-semibold">
        {{ data.label }}
      </p>
    </div>
  </lf-tooltip>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import LfIconOld from '@/ui-kit/icon/IconOld.vue';
import LfTooltip from '@/ui-kit/tooltip/Tooltip.vue';
import { Contributor } from '@/modules/contributor/types/Contributor';

const props = defineProps<{
  contributor: Contributor,
}>();

const data = computed<{
  icon: string,
  label: string,
  class: string,
} | null>(() => {
  if (!props.contributor.averageSentiment) {
    return null;
  }
  if (props.contributor.averageSentiment >= 67) {
    return {
      icon: 'emotion-happy-line',
      label: 'Positive',
      class: 'text-green-600',
    };
  }
  if (props.contributor.averageSentiment <= 33) {
    return {
      icon: 'emotion-unhappy-line',
      label: 'Negative',
      class: 'text-red-500',
    };
  }
  return {
    icon: 'emotion-normal-line',
    label: 'Neutral',
    class: 'text-gray-400',
  };
});
</script>

<script lang="ts">
export default {
  name: 'LfContributorSentiment',
};
</script>
