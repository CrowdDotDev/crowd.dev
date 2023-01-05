<template>
  <query-renderer
    v-if="cubejsApi"
    :cubejs-api="cubejsApi"
    :query="query"
  >
    <template #default="{ resultSet }">
      <div class="bg-white px-6 py-5 rounded-lg shadow">
        <!-- Widget Header -->
        <div
          class="flex grow justify-between items-center pb-5 mb-8 border-b border-gray-100"
        >
          <div class="flex gap-1">
            <app-widget-granularity
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
            :period="period"
            module="reports"
            @on-update="
              (updatedPeriod) => (period = updatedPeriod)
            "
          />
        </div>

        <!-- Widget Chart -->
        <app-widget-area
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
import { chartOptions } from '@/modules/report/template-report-charts'
import pluralize from 'pluralize'
import moment from 'moment'

const period = ref(SEVEN_DAYS_PERIOD_FILTER)
const granularity = ref(DAILY_GRANULARITY_FILTER)

const datasets = computed(() => [
  {
    name: 'Total members',
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
    {
      measures: ['Members.count'],
      timeDimensions: [
        {
          dateRange: `Last ${
            period.value.value
          } ${pluralize(
            period.value.granularity,
            period.value.value,
            false
          )}`,
          dimension: 'Activities.date',
          granularity: granularity.value.value
        }
      ]
    },
    {
      measures: ['Members.count'],
      timeDimensions: [
        {
          dateRange: `Last ${
            period.value.value
          } ${pluralize(
            period.value.granularity,
            period.value.value,
            false
          )}`,
          dimension: 'Activities.date',
          granularity: granularity.value.value
        }
      ],
      filters: [
        {
          member: 'Members.joinedAt',
          operator: 'beforeDate',
          values: [
            moment()
              .utc()
              .startOf('day')
              .subtract(
                period.value.value,
                period.value.granularity
              )
              .format('YYYY-MM-DD')
          ]
        }
      ]
    }
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
