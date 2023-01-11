<template>
  <query-renderer
    v-if="cubejsApi"
    :cubejs-api="cubejsApi"
    :query="query"
  >
    <template #default="{ resultSet, loading, error }">
      <div class="bg-white px-6 py-5 rounded-lg shadow">
        <!-- Widget Header -->
        <div
          class="flex grow justify-between items-center pb-5 border-b border-gray-100"
          :class="{ 'mb-8': !loading && !error }"
        >
          <div class="flex gap-1">
            <app-widget-granularity
              template="Members"
              widget="Active members"
              :granularity="granularity"
              @on-update="
                (updatedGranularity) =>
                  (granularity = updatedGranularity)
              "
            />
            <app-widget-title
              title="Active members"
              description="Members who performed any kind of activity in a given time period"
            />
          </div>
          <app-widget-period
            template="Members"
            widget="Active members"
            :period="period"
            :granularity="granularity"
            module="reports"
            @on-update="
              (updatedPeriod) => (period = updatedPeriod)
            "
          />
        </div>

        <!-- Loading -->
        <app-widget-loading v-if="loading" />

        <!-- Error -->
        <app-widget-error v-else-if="error" />

        <!-- Widget Chart -->
        <app-widget-area
          v-else
          :datasets="datasets"
          :result-set="resultSet"
          :chart-options="{
            ...chartOptions('area')
          }"
        />
      </div>
    </template>
  </query-renderer>
</template>

<script>
export default {
  name: 'AppWidgetActiveMembersArea'
}
</script>

<script setup>
import { computed, ref } from 'vue'
import AppWidgetTitle from '@/modules/widget/components/v2/shared/widget-title.vue'
import AppWidgetPeriod from '@/modules/widget/components/v2/shared/widget-period.vue'
import AppWidgetGranularity from '@/modules/widget/components/v2/shared/widget-granularity.vue'
import AppWidgetArea from '@/modules/widget/components/v2/shared/widget-area.vue'
import {
  DAILY_GRANULARITY_FILTER,
  SEVEN_DAYS_PERIOD_FILTER
} from '@/modules/widget/widget-constants'
import { QueryRenderer } from '@cubejs-client/vue3'
import { mapGetters } from '@/shared/vuex/vuex.helpers'
import { chartOptions } from '@/modules/report/templates/template-report-charts'
import {
  TOTAL_ACTIVE_MEMBERS_QUERY,
  TOTAL_ACTIVE_RETURNING_MEMBERS_QUERY
} from '@/modules/widget/widget-queries'
import AppWidgetLoading from '@/modules/widget/components/v2/shared/widget-loading.vue'
import AppWidgetError from '@/modules/widget/components/v2/shared/widget-error.vue'

const period = ref(SEVEN_DAYS_PERIOD_FILTER)
const granularity = ref(DAILY_GRANULARITY_FILTER)

const datasets = computed(() => [
  {
    name: 'Total active members',
    borderColor: '#E94F2E',
    measure: 'Members.count',
    granularity: granularity.value.value
  },
  {
    name: 'Returning members',
    borderDash: [4, 4],
    borderColor: '#E94F2E',
    measure: 'Members.count',
    granularity: granularity.value.value
  }
])
const query = computed(() => {
  return [
    TOTAL_ACTIVE_MEMBERS_QUERY(
      period.value,
      granularity.value
    ),
    TOTAL_ACTIVE_RETURNING_MEMBERS_QUERY(
      period.value,
      granularity.value
    )
  ]
})

const { cubejsApi } = mapGetters('widget')
</script>

<style lang="scss" scoped>
.cube-widget-chart {
  padding: 24px 0;
  min-height: 348px;
}
</style>
