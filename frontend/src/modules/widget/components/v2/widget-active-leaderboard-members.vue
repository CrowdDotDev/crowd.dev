<template>
  <div class="bg-white pt-5 rounded-lg shadow">
    <div class="px-6">
      <!-- Widget Header -->
      <div
        class="flex grow justify-between items-center pb-5 border-b border-gray-100"
        :class="{ 'mb-8': !loading && !error && !empty }"
      >
        <div class="flex gap-1">
          <app-widget-title
            title="Leaderbord: Most active members"
            description="Members who were active on the most days in the selected time period"
          />
        </div>
        <app-widget-period
          template="Members"
          widget="Leaderbord: Most active members"
          :period="selectedPeriod"
          module="reports"
          @on-update="onUpdatePeriod"
        />
      </div>

      <!-- Loading -->
      <app-widget-loading v-if="loading" type="table" />

      <!-- Empty -->
      <app-widget-empty v-else-if="empty" type="table" />

      <!-- Error -->
      <app-widget-error v-else-if="error" />

      <!-- Widget Chart -->
      <div v-else>
        <app-widget-members-table
          :list="activeMembers"
          @on-row-click="onRowClick"
        />
        <div class="flex justify-end">
          <el-button
            class="btn btn-link btn-link--primary mt-4 mb-8"
            @click="handleDrawerOpen"
            >View all</el-button
          >
        </div>
      </div>
    </div>

    <app-widget-insight
      :description="`We recommend speaking with these members, as they went above and beyond in the last ${pluralize(
        selectedPeriod.granularity,
        selectedPeriod.value,
        true
      )}. They are probably eager to share their experiences and enthusiasm for your community.`"
    />
  </div>
  <app-widget-drawer
    v-if="drawerExpanded"
    v-model="drawerExpanded"
    :fetch-fn="getDetailedActiveMembers"
    :title="drawerTitle"
    :show-period="true"
    :export-by-ids="true"
    :period="selectedPeriod"
    :show-active-days="true"
    module-name="member"
    size="480px"
    @on-export="onExport"
  ></app-widget-drawer>
</template>

<script>
export default {
  name: 'AppWidgetActiveLeaderboardMembers'
}
</script>

<script setup>
import {
  ref,
  onMounted,
  computed,
  defineProps,
  watch
} from 'vue'
import AppWidgetTitle from '@/modules/widget/components/v2/shared/widget-title.vue'
import AppWidgetPeriod from '@/modules/widget/components/v2/shared/widget-period.vue'
import AppWidgetInsight from '@/modules/widget/components/v2/shared/widget-insight.vue'
import AppWidgetMembersTable from '@/modules/widget/components/v2/shared/widget-members-table.vue'
import { SEVEN_DAYS_PERIOD_FILTER } from '@/modules/widget/widget-constants'
import { MemberService } from '@/modules/member/member-service'
import pluralize from 'pluralize'
import AppWidgetLoading from '@/modules/widget/components/v2/shared/widget-loading.vue'
import AppWidgetError from '@/modules/widget/components/v2/shared/widget-error.vue'
import AppWidgetEmpty from '@/modules/widget/components/v2/shared/widget-empty.vue'
import AppWidgetDrawer from '@/modules/widget/components/v2/shared/widget-drawer.vue'
import { mapActions } from '@/shared/vuex/vuex.helpers'
import moment from 'moment'

const props = defineProps({
  platforms: {
    type: Array,
    default: () => []
  },
  teamMembers: {
    type: Boolean,
    default: false
  }
})

const drawerExpanded = ref()
const drawerTitle = ref()

const selectedPeriod = ref(SEVEN_DAYS_PERIOD_FILTER)
const activeMembers = ref([])
const loading = ref(false)
const error = ref(false)

const { doExport } = mapActions('member')

const empty = computed(
  () =>
    !loading.value &&
    !error.value &&
    activeMembers.value.length === 0
)

onMounted(async () => {
  const response = await getActiveMembers(
    selectedPeriod.value
  )

  activeMembers.value = response
})

// Each time filter changes, query a new response
watch(
  () => [props.platforms, props.teamMembers],
  async ([platforms, teamMembers]) => {
    const response = await getActiveMembers(
      selectedPeriod.value,
      platforms,
      teamMembers
    )

    activeMembers.value = response
  }
)

const onUpdatePeriod = async (updatedPeriod) => {
  const response = await getActiveMembers(updatedPeriod)

  activeMembers.value = response
  selectedPeriod.value = updatedPeriod
}

const getActiveMembers = async (
  period = selectedPeriod.value,
  platforms = props.platforms,
  teamMembers = props.teamMembers
) => {
  loading.value = true
  error.value = false

  try {
    const response = await MemberService.listActive({
      platform: platforms,
      isTeamMember: teamMembers,
      activityTimestampFrom: moment()
        .utc()
        .subtract(period.value, period.granularity)
        .toISOString(),
      activityTimestampTo: moment().utc(),
      orderBy: 'activeDaysCount_DESC',
      offset: 0,
      limit: 10
    })

    loading.value = false

    return response.rows
  } catch (e) {
    loading.value = false
    error.value = true
    console.error(e)
    return []
  }
}

// Fetch function to pass to detail drawer
const getDetailedActiveMembers = async ({
  pagination,
  period = selectedPeriod.value
}) => {
  return await MemberService.listActive({
    platform: props.platforms,
    isTeamMember: props.teamMembers,
    activityTimestampFrom: moment()
      .utc()
      .subtract(period.value, period.granularity)
      .toISOString(),
    activityTimestampTo: moment().utc(),
    orderBy: 'activeDaysCount_DESC',
    offset: !pagination.count
      ? (pagination.currentPage - 1) * pagination.pageSize
      : 0,
    limit: !pagination.count
      ? pagination.pageSize
      : pagination.count
  })
}

const onRowClick = () => {
  window.analytics.track('Click table widget row', {
    template: 'Members report',
    widget: 'Leaderbord: Most active members'
  })
}

// Open drawer and set title
const handleDrawerOpen = async () => {
  window.analytics.track('Open report drawer', {
    template: 'Members report',
    widget: 'Leaderbord: Most active members',
    period: selectedPeriod.value
  })

  drawerExpanded.value = true
  drawerTitle.value = 'Most active members'
}

const onExport = async ({ ids, count }) => {
  try {
    await doExport({
      selected: true,
      customIds: ids,
      count
    })
  } catch (error) {
    console.log(error)
  }
}
</script>
