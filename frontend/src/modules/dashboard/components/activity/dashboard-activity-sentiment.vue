<template>
  <h6 v-if="chartData?.activity?.bySentimentMood" class="text-sm leading-5 font-semibold mb-4">
    Overall sentiment
  </h6>
  <div v-if="!chartData">
    <div class="pb-3">
      <app-loading height="8px" />
    </div>
    <div class="flex justify-between pb-2">
      <p class="text-sm font-medium">
        Positive
      </p>
      <app-loading
        class="py-1"
        height="12px"
        width="40px"
      />
    </div>
    <div class="flex justify-between pb-2">
      <p class="text-sm font-medium">
        Negative
      </p>
      <app-loading
        class="py-1"
        height="12px"
        width="40px"
      />
    </div>
  </div>
  <div v-else>
    <div>
      <div class="flex w-full pb-5">
        <div
          v-for="(count, type) in bySentiment"
          :key="type"
          class="h-2 border-x-2 border-white rounded-lg transition cursor-pointer"
          :style="{
            width: `${calculatePercentage(count)}%`,
          }"
          :class="[
            hoverSentimentClass(type),
            valuesByType[type].class,
          ]"
          @mouseover="hoveredSentiment = type"
          @mouseleave="hoveredSentiment = ''"
          @click="handleSentimentClick(type)"
        />
      </div>
      <div>
        <div
          v-for="(count, type) in bySentiment"
          :key="type"
          class="flex items-center pb-3 cursor-pointer"
          :class="hoverSentimentClass(type)"
          @mouseover="hoveredSentiment = type"
          @mouseleave="hoveredSentiment = ''"
          @click="handleSentimentClick(type)"
        >
          <lf-icon :name="valuesByType[type].emoji" :size="20" class="mr-2" />
          <p
            class="text-sm font-medium capitalize pr-2"
          >
            {{ type }}
          </p>
          <p class="text-sm text-gray-400 text-right">
            {{ count }}・{{
              calculatePercentage(count)
            }}%
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import AppLoading from '@/shared/loading/loading-placeholder.vue';
import { useRouter } from 'vue-router';
import { filterQueryService } from '@/shared/modules/filters/services/filter-query.service';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const router = useRouter();

const { chartData } = mapGetters('dashboard');

const bySentiment = computed(() => {
  const sentimentMap: Record<string, number> = {
    positive: 0,
    negative: 0,
    neutral: 0,
  };

  if (chartData.value?.activity?.bySentimentMood) {
    chartData.value.activity.bySentimentMood.forEach((item: { sentimentLabel: string, count: number }) => {
      sentimentMap[item.sentimentLabel] = item.count;
    });
  }

  return sentimentMap;
});

const total = computed(() => Object.values(bySentiment.value).reduce((a, b) => a + b, 0));

const calculatePercentage = (count: number) => (total.value > 0 ? Math.round((count / total.value) * 100) : 0);

const hoveredSentiment = ref('');

const valuesByType: Record<string, { class: string, emoji: string }> = {
  positive: {
    class: 'bg-green-500',
    emoji: 'face-grin text-green-500',
  },
  negative: {
    class: 'bg-red-500',
    emoji: 'face-frown-open text-red-500',
  },
  neutral: {
    class: 'bg-gray-300',
    emoji: 'face-meh text-gray-400',
  },
};

const hoverSentimentClass = (type: string) => (hoveredSentiment.value !== type && hoveredSentiment.value !== '' ? 'opacity-50' : '');

const handleSentimentClick = (sentiment: string) => {
  router.push({
    name: 'activity',
    query: filterQueryService().setQuery({
      search: '',
      relation: 'and',
      order: {
        prop: 'timestamp',
        order: 'descending',
      },
      sentiment: {
        value: [sentiment],
        include: true,
      },
    }),
    hash: '#activity',
  });
};
</script>

<script lang="ts">
export default {
  name: 'AppDashboardActivitySentiment',
};
</script>
