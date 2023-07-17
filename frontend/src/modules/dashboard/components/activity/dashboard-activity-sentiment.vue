<template>
  <app-cube-render
    :query="sentimentQuery(period, platform, segments.childSegments)"
  >
    <template #loading>
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
    </template>
    <template #default="{ resultSet }">
      <div>
        <div v-if="!loadingData(resultSet)">
          <div class="flex w-full pb-5">
            <div
              v-for="data of compileData(resultSet)"
              :key="data.type"
              class="h-2 border-x-2 border-white rounded-lg transition cursor-pointer"
              :style="{
                width: `${calculatePercentage(data.count)}%`,
              }"
              :class="[
                hoverSentimentClass(data.type),
                typeClasses[data.type],
              ]"
              @mouseover="hoveredSentiment = data.type"
              @mouseleave="hoveredSentiment = ''"
              @click="handleSentimentClick(data.type)"
            />
          </div>
          <div>
            <div
              v-for="data of compileData(resultSet)"
              :key="data.type"
              class="flex items-center pb-3 cursor-pointer"
              :class="hoverSentimentClass(data.type)"
              @mouseover="hoveredSentiment = data.type"
              @mouseleave="hoveredSentiment = ''"
              @click="handleSentimentClick(data.type)"
            >
              <i
                class="text-lg mr-2 flex items-center h-5"
                :class="typeEmoji[data.type]"
              />
              <p
                class="text-sm font-medium capitalize pr-2"
              >
                {{ data.type }}
              </p>
              <p class="text-sm text-gray-400 text-right">
                {{ data.count }}・{{
                  calculatePercentage(data.count)
                }}%
              </p>
            </div>
          </div>
        </div>
        <div
          v-else-if="noData"
          class="text-xs italic text-gray-400"
        >
          No data
        </div>
      </div>
    </template>
  </app-cube-render>
</template>

<script>
import { mapGetters } from 'vuex';
import { sentimentQuery } from '@/modules/dashboard/dashboard.cube';
import AppCubeRender from '@/shared/cube/cube-render.vue';
import AppLoading from '@/shared/loading/loading-placeholder.vue';
import { filterQueryService } from '@/shared/modules/filters/services/filter-query.service';

export default {
  name: 'AppDashboardActivitySentiment',
  components: {
    AppLoading,
    AppCubeRender,
  },
  data() {
    return {
      hoveredSentiment: '',
      sentimentQuery,
      total: 0,
      typeClasses: {
        positive: 'bg-green-500',
        negative: 'bg-red-500',
        neutral: 'bg-gray-300',
      },
      typeEmoji: {
        positive: 'ri-emotion-happy-line text-green-500',
        negative: 'ri-emotion-unhappy-line text-red-500',
        neutral: 'ri-emotion-normal-line text-gray-400',
      },
    };
  },
  computed: {
    ...mapGetters('dashboard', ['period', 'platform', 'segments']),
  },
  methods: {
    calculatePercentage(count) {
      return Math.round((count / this.total) * 100);
    },
    hoverSentimentClass(type) {
      return this.hoveredSentiment !== type
        && this.hoveredSentiment !== ''
        ? 'opacity-50'
        : '';
    },
    loadingData(resultSet) {
      return (
        !resultSet || resultSet.loadResponse === undefined
      );
    },
    noData(resultSet) {
      return this.loadingData(resultSet) && this.total === 0;
    },
    compileData(resultSet) {
      const seriesNames = resultSet.seriesNames();
      const pivot = resultSet.chartPivot();
      let series = [];
      seriesNames.forEach((e) => {
        const data = pivot.map((p) => [p.x, p[e.key]]);
        series = [...series, ...data];
      });
      const seriesObject = series.reduce(
        (a, [key, value]) => ({
          ...a,
          [key]: value,
        }),
        {},
      );
      const result = {
        positive: seriesObject.positive || 0,
        negative: seriesObject.negative || 0,
        neutral: seriesObject.neutral || 0,
      };
      const finalResult = Object.entries(result)
        .sort(([, a], [, b]) => b - a)
        .map(([type, count]) => ({
          type,
          count,
        }))
        .filter(({ count }) => count > 0);

      this.total = finalResult.reduce((a, b) => a + b.count, 0);

      return finalResult;
    },
    handleSentimentClick(sentiment) {
      this.$router.push({
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
    },
  },
};
</script>
