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
      <div v-else>
        <pre>{{ compileData(resultSet) }}</pre>
        <div class="flex w-full pb-3">
          <div
            class="h-2 bg-green-500 border-l border-r rounded-sm transition"
            :style="{ width: `${60}%` }"
            :class="hoverSentimentClass('positive')"
            @mouseover="hoveredSentiment = 'positive'"
            @mouseleave="hoveredSentiment = ''"
          ></div>
          <div
            class="h-2 bg-red-500 border-l border-r rounded-sm transition"
            :class="hoverSentimentClass('negative')"
            :style="{ width: `${40}%` }"
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
            600・60%
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
            400・40%
          </p>
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
      sentimentQuery
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
      // For line & area charts
      const seriesNames = resultSet.seriesNames()
      const pivot = resultSet.chartPivot()
      console.log(seriesNames, pivot)
    }
  }
}
</script>
