<template>
  <h6 v-if="cube?.activity?.bySentimentMood" class="text-sm leading-5 font-semibold mb-4">
    Overall sentiment
  </h6>
  <div v-if="!cube">
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
          <i
            class="text-lg mr-2 flex items-center h-5"
            :class="valuesByType[type].emoji"
          />
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

<script lang="ts" setup>
import AppLoading from '@/shared/loading/loading-placeholder.vue';
import { computed, ref } from 'vue';
import { DashboardCubeData } from '@/modules/dashboard/types/DashboardCubeData';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { useRouter } from 'vue-router';
import { filterQueryService } from '@/shared/modules/filters/services/filter-query.service';
import { ResultSet } from '@cubejs-client/core';

const router = useRouter();

const {
  cubeData,
} = mapGetters('dashboard');

const cube = computed<DashboardCubeData>(() => cubeData.value);

const bySentiment = computed<Record<string, number>>(() => {
  if (!cube.value?.activity?.bySentimentMood) {
    return {
      positive: 0,
      negative: 0,
      neutral: 0,
    };
  }
  const data = new ResultSet(cube.value.activity.bySentimentMood);
  const seriesNames = data.seriesNames();
  const pivot = data.chartPivot();
  let series: any[] = [];
  seriesNames.forEach((e: any) => {
    const data = pivot.map((p: any) => [p.x, p[e.key]]);
    series = [...series, ...data];
  });
  const seriesObject = series.reduce(
    (a, [key, value]) => ({
      ...a,
      [key]: +value,
    }),
    {},
  );

  return {
    positive: seriesObject.positive > 0 ? seriesObject.positive : undefined,
    negative: seriesObject.negative > 0 ? seriesObject.negative : undefined,
    neutral: seriesObject.neutral > 0 ? seriesObject.neutral : undefined,
  };
});

const total = computed(() => Object.values(bySentiment.value).reduce((a, b) => a + b, 0));

const calculatePercentage = (count: number) => Math.round((count / total.value) * 100);

const hoveredSentiment = ref('');

const valuesByType: Record<string, {class:string, emoji: string}> = {
  positive: {
    class: 'bg-green-500',
    emoji: 'ri-emotion-happy-line text-green-500',
  },
  negative: {
    class: 'bg-red-500',
    emoji: 'ri-emotion-unhappy-line text-red-500',
  },
  neutral: {
    class: 'bg-gray-300',
    emoji: 'ri-emotion-normal-line text-gray-400',
  },
};

const hoverSentimentClass = (type: string) => (hoveredSentiment.value !== type
  && hoveredSentiment.value !== ''
  ? 'opacity-50'
  : '');

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
