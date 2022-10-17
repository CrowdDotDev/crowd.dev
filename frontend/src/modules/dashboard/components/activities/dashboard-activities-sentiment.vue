<template>
  <query-renderer
    v-if="cubejsApi"
    :cubejs-api="cubejsApi"
    :query="sentimentQuery(period, platform)"
  >
    <template #default="{ resultSet }">
      <div
        v-if="loading(resultSet)"
        v-loading="loading(resultSet)"
        class="app-page-spinner h-16 !relative !min-h-5"
      ></div>
      <div v-else :set="compileData(resultSet)">
        <div v-if="result.negative + result.positive > 0">
          <div class="flex w-full pb-3">
            <div
              class="h-2 bg-green-500 border-l border-r rounded-sm transition"
              :style="{ width: `${result.positive}%` }"
              :class="hoverSentimentClass('positive')"
              @mouseover="hoveredSentiment = 'positive'"
              @mouseleave="hoveredSentiment = ''"
            ></div>
            <div
              class="h-2 bg-red-500 border-l border-r rounded-sm transition"
              :class="hoverSentimentClass('negative')"
              :style="{ width: `${result.negative}%` }"
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
              {{ Math.round(result.positive) }}%
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
              {{ Math.round(result.negative) }}%
            </p>
          </div>
        </div>
        <div v-else class="text-xs text-gray-500">
          No sentiment data for this period
        </div>
      </div>
    </template>
  </query-renderer>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { sentimentQuery } from '@/modules/dashboard/dashboard.cube'
import { QueryRenderer } from '@cubejs-client/vue3'
export default {
  name: 'AppDashboardActivitiesSentiment',
  components: {
    QueryRenderer
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
    ...mapGetters('widget', ['cubejsToken', 'cubejsApi']),
    ...mapGetters('dashboard', ['period', 'platform'])
  },
  async created() {
    if (this.cubejsApi === null) {
      await this.getCubeToken()
    }
  },
  methods: {
    ...mapActions({
      getCubeToken: 'widget/getCubeToken'
    }),
    hoverSentimentClass(type) {
      return this.hoveredSentiment !== type &&
        this.hoveredSentiment !== ''
        ? 'opacity-50'
        : ''
    },
    loading(resultSet) {
      return (
        !resultSet || resultSet.loadResponse === undefined
      )
    },
    compileData(resultSet) {
      const seriesNames = resultSet.seriesNames()
      const pivot = resultSet.chartPivot()
      let series = []
      seriesNames.forEach((e) => {
        const data = pivot.map((p) => [p['x'], p[e.key]])
        console.log(data);
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
