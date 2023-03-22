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
            <app-widget-title
              title="Monthly active contributors"
            />
          </div>
          <app-widget-period
            template="Product-community fit"
            widget="Monthly active contributors"
            :period="period"
            :granularity="granularity"
            :options="MONTHLY_WIDGET_PERIOD_OPTIONS"
            module="reports"
            @on-update="onUpdatePeriod"
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
          :ideal-range-annotation="idealRangeAnnotation"
          :chart-options="{
            ...chartOptions('area')
          }"
          :granularity="granularity.value"
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
import { computed, ref, defineProps } from 'vue'
import AppWidgetTitle from '@/modules/widget/components/v2/shared/widget-title.vue'
import AppWidgetPeriod from '@/modules/widget/components/v2/shared/widget-period.vue'
import AppWidgetArea from '@/modules/widget/components/v2/shared/widget-area.vue'
import {
  ALL_TIME_PERIOD_FILTER,
  MONTHLY_GRANULARITY_FILTER,
  MONTHLY_WIDGET_PERIOD_OPTIONS,
  SIX_MONTHS_PERIOD_FILTER,
  YEARLY_GRANULARITY_FILTER
} from '@/modules/widget/widget-constants'
import { chartOptions } from '@/modules/report/templates/template-report-charts'
import AppWidgetLoading from '@/modules/widget/components/v2/shared/widget-loading.vue'
import AppWidgetError from '@/modules/widget/components/v2/shared/widget-error.vue'
import { TOTAL_MONTHLY_ACTIVE_CONTRIBUTORS } from '@/modules/widget/widget-queries'
import { QueryRenderer } from '@cubejs-client/vue3'
import { mapGetters } from '@/shared/vuex/vuex.helpers'

const props = defineProps({
  filters: {
    type: Object,
    default: null
  },
  isPublicView: {
    type: Boolean,
    default: false
  }
})

const period = ref(SIX_MONTHS_PERIOD_FILTER)
const granularity = ref(MONTHLY_GRANULARITY_FILTER)

const { cubejsApi } = mapGetters('widget')

const idealRangeAnnotation = {
  backgroundColor: 'rgba(233, 79, 46, 0.05)',
  yMin: 50,
  yMax: 100,
  borderColor: 'transparent',
  type: 'box'
}

const datasets = computed(() => [
  {
    name: 'Monthly active contributors',
    borderColor: '#E94F2E',
    backgroundColor: 'transparent',
    measure: 'Members.count',
    granularity: granularity.value.value,
    ...(!props.isPublicView && {
      tooltipBtn: 'View members'
    }),
    showLegend: false
  },
  {
    name: 'Product-Community fit',
    backgroundColor: 'rgba(233, 79, 46, 0.05)',
    borderColor: 'transparent',
    pointStyle: 'rect',
    hidden: true
  }
])

const query = computed(() => {
  return TOTAL_MONTHLY_ACTIVE_CONTRIBUTORS({
    period: period.value,
    granularity: granularity.value,
    selectedHasTeamMembers: props.filters.teamMembers
  })
})

const onUpdatePeriod = (updatedPeriod) => {
  period.value = updatedPeriod

  if (
    updatedPeriod.label === ALL_TIME_PERIOD_FILTER.label
  ) {
    granularity.value = YEARLY_GRANULARITY_FILTER
  } else {
    granularity.value = MONTHLY_GRANULARITY_FILTER
  }
}
</script>

<style lang="scss" scoped>
.cube-widget-chart {
  padding: 24px 0;
  min-height: 348px;
}
</style>
