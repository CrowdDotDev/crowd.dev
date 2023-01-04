<template>
  <query-renderer
    v-if="cubejsApi"
    :cubejs-api="cubejsApi"
    :query="widget.settings.query"
  >
    <template #default="{ resultSet }">
      <div class="bg-white px-6 py-5 rounded-lg shadow">
        <!-- Widget Header -->
        <div
          class="flex grow justify-between items-center pb-5"
        >
          <div class="flex gap-1">
            <app-widget-granularity
              v-if="granularity"
              :granularity="granularity"
              @on-update="
                emits('onUpdateGranularity', granularity)
              "
            />
            <app-widget-title
              :title="widget.title"
              :description="widget.description"
            />
          </div>
          <app-widget-period
            v-if="period"
            :period="period"
            module="reports"
            @on-update="emits('onUpdatePeriod', period)"
          />
        </div>

        <!-- Widget Chart -->
        <app-widget-area
          :widget="widget"
          :result-set="resultSet"
          :chart-options="{
            ...chartOptions,
            ...chartOptions(widget, resultSet)
          }"
        />
      </div>
    </template>
  </query-renderer>
</template>

<script>
export default {
  name: 'AppWidgetArea'
}
</script>

<script setup>
import { defineProps, defineEmits } from 'vue'
import AppWidgetTitle from '@/modules/widget/components/v2/shared/widget-title.vue'
import AppWidgetPeriod from '@/modules/widget/components/v2/shared/widget-period.vue'
import AppWidgetGranularity from '@/modules/widget/components/v2/shared/widget-granularity.vue'
import AppWidgetArea from '@/modules/widget/components/v2/shared/widget-area.vue'
import {
  DAILY_GRANULARITY_FILTER,
  THIRTY_DAYS_PERIOD_FILTER
} from '@/modules/widget/widget-constants'
import { QueryRenderer } from '@cubejs-client/vue3'
import { mapGetters } from '@/shared/vuex/vuex.helpers'
import { chartOptions } from '@/modules/report/report-charts'

const emits = defineEmits([
  'onUpdatePeriod',
  'onUpdateGranularity'
])

defineProps({
  widget: {
    type: Object,
    required: true
  }
})

const { cubejsApi } = mapGetters('widget')

// TBD: To be refactored
const period = THIRTY_DAYS_PERIOD_FILTER
const granularity = DAILY_GRANULARITY_FILTER
</script>

<style lang="scss" scoped>
.cube-widget-chart {
  padding: 24px 0;
  min-height: 348px;
}
</style>
