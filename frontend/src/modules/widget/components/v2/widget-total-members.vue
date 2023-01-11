<template>
  <div class="widget-total-members">
    <div class="flex justify-between items-center mb-4">
      <app-widget-title
        text-size="text-base"
        description="All members who did at least one activity in your community and its evolution over time"
        title="Total members"
        class="mb-5"
      />
      <app-widget-period
        :period="period"
        module="report"
        @on-update="
          (updatedPeriod) => (period = updatedPeriod)
        "
      ></app-widget-period>
    </div>
    <div>
      <query-renderer
        v-if="cubejsApi"
        :cubejs-api="cubejsApi"
        :query="query"
      >
        <template #default="{ resultSet, loading, error }">
          <!-- Loading -->
          <app-widget-loading v-if="loading" size="small" />

          <!-- Error -->
          <app-widget-error v-else-if="error" />

          <!-- Widgets -->
          <div v-else class="grid grid-cols-12 gap-2">
            <div class="col-span-5">
              <app-widget-kpi
                :current-value="kpiCurrentValue(resultSet)"
                :previous-value="
                  kpiPreviousValue(resultSet)
                "
                :vs-label="`vs. last ${period.extendedLabel}`"
                class="col-span-5"
              ></app-widget-kpi>
            </div>
            <div class="col-span-7 chart">
              <app-widget-area
                :result-set="chartResultSet(resultSet)"
                :datasets="datasets"
                :chart-options="customChartOptions"
              />
            </div>
          </div>
        </template>
      </query-renderer>
    </div>
  </div>
</template>
<script setup>
import moment from 'moment'
import cloneDeep from 'lodash/cloneDeep'
import { ref, computed } from 'vue'
import { QueryRenderer } from '@cubejs-client/vue3'
import { SEVEN_DAYS_PERIOD_FILTER } from '@/modules/widget/widget-constants'
import { chartOptions } from '@/modules/report/templates/template-report-charts'

import AppWidgetKpi from '@/modules/widget/components/v2/shared/widget-kpi'
import AppWidgetTitle from '@/modules/widget/components/v2/shared/widget-title'
import AppWidgetPeriod from '@/modules/widget/components/v2/shared/widget-period'
import AppWidgetArea from '@/modules/widget/components/v2/shared/widget-area'
import AppWidgetLoading from '@/modules/widget/components/v2/shared/widget-loading'
import AppWidgetError from '@/modules/widget/components/v2/shared/widget-error'

import { mapGetters } from '@/shared/vuex/vuex.helpers'

const customChartOptions = cloneDeep(chartOptions('area'))
customChartOptions.library.plugins.legend = {}

const period = ref(SEVEN_DAYS_PERIOD_FILTER)
const platform = ref('all')

const datasets = [
  {
    name: 'Total members',
    borderColor: '#E94F2E',
    measure: 'Members.cumulativeCount'
  }
]

const { cubejsApi } = mapGetters('widget')
const query = computed(() => {
  return {
    measures: ['Members.cumulativeCount'],
    timeDimensions: [
      {
        dimension: 'Members.joinedAt',
        granularity: 'day',
        dateRange: dateRange(period)
      }
    ],
    filters:
      platform.value !== 'all'
        ? [
            {
              member: 'Activities.platform',
              operator: 'equals',
              values: [platform]
            }
          ]
        : undefined
  }
})

const dateRange = (period) => {
  const end = moment().utc().format('YYYY-MM-DD')
  const start = moment()
    .utc()
    .subtract(period.value.value, period.value.granularity)
    // we're subtracting one more day, to get the last value of the previous period within the same request
    .subtract(1, 'day')
    .format('YYYY-MM-DD')

  return [start, end]
}

const kpiCurrentValue = (resultSet) => {
  const data = resultSet.chartPivot()
  return Number(
    data[data.length - 1]['Members.cumulativeCount']
  )
}

const kpiPreviousValue = (resultSet) => {
  const data = resultSet.chartPivot()
  return Number(data[0]['Members.cumulativeCount'])
}

const chartResultSet = (resultSet) => {
  const clone = cloneDeep(resultSet)

  // We'll be excluding the first data point, since it's related to the last period
  clone.loadResponses[0].data = spliceFirstValue(
    clone.loadResponses[0].data
  )

  // Then we also fix the first entry of the dateRange
  clone.loadResponses[0].query.timeDimensions[0].dateRange[0] =
    moment(
      clone.loadResponses[0].query.timeDimensions[0]
        .dateRange[0]
    )
      .utc()
      .add(1, 'day')
      .format('YYYY-MM-DD')

  return clone
}

const spliceFirstValue = (data) => {
  return cloneDeep(data).reduce((acc, item, index) => {
    if (index !== 0) {
      acc.push({
        ...item
      })
    }
    return acc
  }, [])
}
</script>

<style lang="scss" scoped>
.widget-total-members {
  @apply bg-white shadow rounded-lg p-6;
  .chart::v-deep {
    div {
      line-height: 100px !important;
      height: auto !important;
    }
    .cube-widget-chart {
      padding: 0;
      min-height: 0;
    }
    canvas {
      height: 100px;
    }
  }
}
</style>
