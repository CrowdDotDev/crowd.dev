<template>
  <div class="flex items-center gap-1.5 font-semibold text-small">
    <p v-if="!data" class=" text-gray-400">
      Computing
    </p>
    <template v-else>
      <div class="text-white h-4 px-1 min-w-4 flex justify-center rounded" :class="`bg-${data.color}`">
        {{ props.contributor.score }}
      </div>
      <p :class="`text-${data.color}`">
        {{ data.label }}
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Contributor } from '@/modules/contributor/types/Contributor';

const props = defineProps<{
  contributor: Contributor,
}>();

const data = computed<{
  label: string,
  color: string,
} | null>(() => {
  const { score } = props.contributor;
  if (score < 0) {
    return null;
  }
  if (score <= 1) {
    return {
      label: 'Silent',
      color: 'red-500',
    };
  }
  if (score <= 3) {
    return {
      label: 'Quiet',
      color: 'yellow-500',
    };
  }
  if (score <= 6) {
    return {
      label: 'Engaged',
      color: 'green-500',
    };
  }
  if (score <= 8) {
    return {
      label: 'Fan',
      color: 'primary-500',
    };
  }
  if (score <= 10) {
    return {
      label: 'Ultra',
      color: 'purple-500',
    };
  }
  return null;
});

</script>

<script lang="ts">
export default {
  name: 'LfContributorEngagementLevel',
};
</script>
