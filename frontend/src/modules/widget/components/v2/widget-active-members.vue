<template>
  <div class="widget-active-members">
    <div class="grid grid-cols-3">
      <div
        v-for="(widget, index) of widgets"
        :key="index"
        class="p-6"
        :class="
          index !== 0
            ? 'border-l border-r border-gray-100'
            : ''
        "
      >
        <div class="flex items-center justify-between mb-4">
          <app-widget-title
            text-size="text-xs"
            :title="widget.title"
          />
          <button
            v-if="currentUser"
            v-show="false"
            type="button"
            class="btn btn-brand--transparent btn--sm"
            @click="handleDrawerOpen(widget.period)"
          >
            View
          </button>
        </div>

        <query-renderer
          v-if="cubejsApi"
          :cubejs-api="cubejsApi"
          :query="widget.query"
        >
          <template
            #default="{ resultSet, loading, error }"
          >
            <!-- Loading -->
            <app-widget-loading v-if="loading" />

            <!-- Error -->
            <app-widget-error v-else-if="error" />

            <app-widget-kpi
              v-else
              :current-value="kpiCurrentValue(resultSet)"
              :previous-value="kpiPreviousValue(resultSet)"
              vs-label="vs. last week"
            ></app-widget-kpi>
          </template>
        </query-renderer>
      </div>
    </div>
    <app-drawer
      v-model="computedDrawerExpanded"
      :title="computedDrawerTitle"
      size="480px"
    ></app-drawer>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { QueryRenderer } from '@cubejs-client/vue3'
import { mapGetters } from '@/shared/vuex/vuex.helpers'
import { TOTAL_ACTIVE_MEMBERS_QUERY } from '@/modules/widget/widget-queries'
import AppWidgetKpi from '@/modules/widget/components/v2/shared/widget-kpi'
import AppWidgetTitle from '@/modules/widget/components/v2/shared/widget-title'
import AppWidgetLoading from '@/modules/widget/components/v2/shared/widget-loading'
import AppWidgetError from '@/modules/widget/components/v2/shared/widget-error'

const { currentUser } = mapGetters('auth')
const { cubejsApi } = mapGetters('widget')

const drawerExpanded = ref(null)

const widgets = computed(() => {
  return [
    {
      title: 'Active members today',
      query: query(
        { value: 1, granularity: 'day' },
        { value: 'day' }
      ),
      period: 'day'
    },
    {
      title: 'Active members this week',
      query: query(
        { value: 14, granularity: 'day' },
        { value: 'week' }
      ),
      period: 'week'
    },
    {
      title: 'Active members this month',
      query: query(
        { value: 30, granularity: 'day' },
        { value: 'month' }
      ),
      period: 'month'
    }
  ]
})

const computedDrawerExpanded = computed({
  get() {
    return drawerExpanded.value !== null
  },
  set(value) {
    if (value === false) {
      drawerExpanded.value = null
    }
  }
})

const computedDrawerTitle = computed(() => {
  let period = 'today'
  if (drawerExpanded.value === 'week') {
    period = 'this week'
  } else if (drawerExpanded.value === 'month') {
    period = 'this month'
  }
  return `Active members ${period}`
})

const query = (period, granularity) => {
  return TOTAL_ACTIVE_MEMBERS_QUERY(period, granularity)
}

const kpiCurrentValue = (resultSet) => {
  if (resultSet.loadResponses[0].data.length === 0) {
    return 0
  }
  const pivot = resultSet.chartPivot()
  return Number(pivot[pivot.length - 1]['Members.count'])
}

const kpiPreviousValue = (resultSet) => {
  if (resultSet.loadResponses[0].data.length === 0) {
    return 0
  }
  const pivot = resultSet.chartPivot()
  return Number(pivot[pivot.length - 2]['Members.count'])
}
const handleDrawerOpen = (period) => {
  drawerExpanded.value = period
}
</script>

<style lang="scss">
.widget-active-members {
  @apply bg-white shadow rounded-lg;
}
</style>
