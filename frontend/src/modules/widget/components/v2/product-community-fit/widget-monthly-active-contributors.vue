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
          @on-view-more-click="onViewMoreClick"
        />
      </div>
    </template>
  </query-renderer>
  <app-widget-drawer
    v-if="drawerExpanded"
    v-model="drawerExpanded"
    :fetch-fn="getActiveMembers"
    :date="drawerDate"
    :granularity="granularity.value"
    :show-date="true"
    :title="drawerTitle"
    :export-by-ids="true"
    module-name="member"
    size="480px"
    @on-export="onExport"
  ></app-widget-drawer>
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
import {
  mapActions,
  mapGetters
} from '@/shared/vuex/vuex.helpers'
import AppWidgetDrawer from '@/modules/widget/components/v2/shared/widget-drawer.vue'
import { MemberService } from '@/modules/member/member-service'
import moment from 'moment'

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
const drawerExpanded = ref()
const drawerDate = ref()
const drawerTitle = ref()

const { cubejsApi } = mapGetters('widget')
const { doExport } = mapActions('member')

const idealRangeAnnotation = {
  backgroundColor: 'rgb(250, 237, 234)',
  yMin: 50,
  yMax: 100,
  borderColor: 'transparent',
  type: 'box',
  drawTime: 'beforeDraw'
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
    backgroundColor: 'rgb(250, 237, 234)',
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

// Fetch function to pass to detail drawer
const getActiveMembers = async ({ pagination }) => {
  const startDate = moment(drawerDate.value).startOf('day')
  const endDate = moment(drawerDate.value)

  if (granularity.value.value === 'month') {
    endDate.startOf('day').add(1, 'month')
  }

  if (granularity.value.value === 'year') {
    endDate.startOf('day').add(1, 'year')
  }

  return await MemberService.listActive({
    platform: [],
    isTeamMember: props.filters.teamMembers,
    activityTimestampFrom: startDate.toISOString(),
    activityTimestampTo: endDate.toISOString(),
    activityIsContribution: true,
    orderBy: 'activityCount_DESC',
    offset: !pagination.count
      ? (pagination.currentPage - 1) * pagination.pageSize
      : 0,
    limit: !pagination.count
      ? pagination.pageSize
      : pagination.count
  })
}

// Open drawer and set drawer title,
// and detailed date
const onViewMoreClick = (date) => {
  window.analytics.track('Open report drawer', {
    template: 'Product-communit fit report',
    widget: 'Monthly active contributors',
    date,
    granularity: granularity.value
  })

  drawerExpanded.value = true
  drawerDate.value = date
  drawerTitle.value = 'Monthly active contributors'
}

const onExport = async ({ ids, count }) => {
  try {
    await doExport({
      selected: true,
      customIds: ids,
      count
    })
  } catch (error) {
    console.error(error)
  }
}
</script>

<style lang="scss" scoped>
.cube-widget-chart {
  padding: 24px 0;
  min-height: 348px;
}
</style>
