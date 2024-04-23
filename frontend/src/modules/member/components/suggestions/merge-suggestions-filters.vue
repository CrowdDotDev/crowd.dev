<template>
  <div class="flex items-center gap-3">
    <app-merge-suggestions-search v-model="form.search" />
    <app-merge-suggestions-confidence-filter v-model="form.confidence" />
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import AppMergeSuggestionsConfidenceFilter
  from '@/modules/member/components/suggestions/filters/merge-suggestions-confidence-filter.vue';
import AppMergeSuggestionsSearch from '@/modules/member/components/suggestions/filters/merge-suggestions-search.vue';

const emit = defineEmits<{(e: 'search', value: any): void}>();

const form = reactive({
  search: '',
  segments: {
    segments: [],
    childSegments: [],
  },
  confidence: [],
});

const defineConfidenceRange = (values: string[]) => {
  const ranges: any = {
    high: { gte: 0.8, lte: 1 },
    medium: { gte: 0.6, lte: 0.79999 },
    low: { gte: 0, lte: 0.59999 },
  };

  if (values.includes('high') && values.includes('low') && !values.includes('medium')) {
    return {
      gte: ranges.high.gte,
      lte: ranges.low.lte,
    };
  }

  let minGte = 1;
  let maxLte = 0;

  values.forEach((value) => {
    const range = ranges[value];
    minGte = Math.min(minGte, range.gte);
    maxLte = Math.max(maxLte, range.lte);
  });

  return {
    gte: minGte,
    lte: maxLte,
  };
};

watch(() => form, (form) => {
  const confidence = defineConfidenceRange(form.confidence);

  emit('search', {
    similarity: confidence,
    displayName: form.search,
  });
}, { deep: true });

</script>

<script lang="ts">
export default {
  name: 'AppMergeSuggestionsFilters',
};
</script>
