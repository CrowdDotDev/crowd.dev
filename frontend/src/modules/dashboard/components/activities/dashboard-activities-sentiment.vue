<template>
  <app-cube-render
    :query="sentimentQuery(period, platform)"
  >
    <template #loading>
      <div class="pb-3">
        <app-loading height="8px"></app-loading>
      </div>
      <div class="flex justify-between pb-2">
        <app-loading
          class="py-1"
          height="13px"
          width="60px"
        ></app-loading>
        <app-loading
          class="py-1"
          height="13px"
          width="45px"
        ></app-loading>
      </div>
      <div class="flex justify-between pb-2">
        <app-loading
          class="py-1"
          height="13px"
          width="60px"
        ></app-loading>
        <app-loading
          class="py-1"
          height="13px"
          width="45px"
        ></app-loading>
      </div>
    </template>
    <template #default="{ resultSet }">
      <div :set="compileData(resultSet)">
        <div v-if="result.negative + result.positive > 0">
          <div class="flex w-full pb-3">
            <div
              class="h-2 bg-green-500 border-l border-r rounded-sm transition"
              :style="{
                width: `${calculatePercentage(
                  result.positive
                )}%`
              }"
              :class="hoverSentimentClass('positive')"
              @mouseover="hoveredSentiment = 'positive'"
              @mouseleave="hoveredSentiment = ''"
            ></div>
            <div
              class="h-2 bg-red-500 border-l border-r rounded-sm transition"
              :class="hoverSentimentClass('negative')"
              :style="{
                width: `${calculatePercentage(
                  result.negative
                )}%`
              }"
              @mouseover="hoveredSentiment = 'negative'"
              @mouseleave="hoveredSentiment = ''"
            ></div>
          </div>
          <div
            class="flex justify-between pb-2"
            :class="hoverSentimentClass('positive')"
            @mouseover="hoveredSentiment = 'positive'"
            @mouseleave="hoveredSentiment = ''"
          >
            <p class="text-sm font-medium">Positive</p>
            <p class="text-xs text-gray-600 text-right">
              {{ result.positive }}・{{
                calculatePercentage(result.positive)
              }}%
            </p>
          </div>
          <div
            class="flex justify-between"
            :class="hoverSentimentClass('negative')"
            @mouseover="hoveredSentiment = 'negative'"
            @mouseleave="hoveredSentiment = ''"
          >
            <p class="text-sm font-medium">Negative</p>
            <p class="text-xs text-gray-600 text-right">
              {{ result.negative }}・{{
                calculatePercentage(result.negative)
              }}%
            </p>
          </div>
        </div>
        <div
          v-else
          class="text-xs text-gray-500 italic text-gray-400"
        >
          No data
        </div>
      </div>
    </template>
  </app-cube-render>
</template>

<script>
import { mapGetters } from 'vuex'
import { sentimentQuery } from '@/modules/dashboard/dashboard.cube'
import AppCubeRender from '@/shared/cube/cube-render'
import AppLoading from '@/shared/loading/loading-placeholder'
export default {
  name: 'AppDashboardActivitiesSentiment',
  components: {
    AppLoading,
    AppCubeRender
  },
  data() {
    return {
      hoveredSentiment: '',
      sentimentQuery,
      result: {
        positive: 0,
        negative: 0
      }
    }
  },
  computed: {
    ...mapGetters('dashboard', ['period', 'platform'])
  },
  methods: {
    calculatePercentage(number) {
      return Math.round(
        (number /
          (this.result.positive + this.result.negative)) *
          100
      )
    },
    hoverSentimentClass(type) {
      return this.hoveredSentiment !== type &&
        this.hoveredSentiment !== ''
        ? 'opacity-50'
        : ''
    },
    compileData(resultSet) {
      const seriesNames = resultSet.seriesNames()
      const pivot = resultSet.chartPivot()
      let series = []
      seriesNames.forEach((e) => {
        const data = pivot.map((p) => [p['x'], p[e.key]])
        series = [...series, ...data]
      })
      const seriesObject = series.reduce(
        (a, [key, value]) => ({
          ...a,
          [key]: value
        }),
        {}
      )
      this.result.positive = seriesObject['positive'] || 0
      this.result.negative = seriesObject['negative'] || 0
    }
  }
}
</script>
