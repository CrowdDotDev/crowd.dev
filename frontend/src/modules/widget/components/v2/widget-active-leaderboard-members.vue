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
          :period="period"
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
      <app-widget-members-table
        v-else
        :members="activeMembers"
        @on-row-click="onRowClick"
      />
    </div>

    <app-widget-insight
      :description="`We recommend speaking with these members, as they went above and beyond in the last ${pluralize(
        period.granularity,
        period.value,
        true
      )}. They are probably eager to share their experiences and enthusiasm for your community.`"
    />
  </div>
</template>

<script>
export default {
  name: 'AppWidgetActiveLeaderboardMembers'
}
</script>

<script setup>
import { ref, onMounted, computed } from 'vue'
import AppWidgetTitle from '@/modules/widget/components/v2/shared/widget-title.vue'
import AppWidgetPeriod from '@/modules/widget/components/v2/shared/widget-period.vue'
import AppWidgetInsight from '@/modules/widget/components/v2/shared/widget-insight.vue'
import AppWidgetMembersTable from '@/modules/widget/components/v2/shared/widget-members-table.vue'
import { SEVEN_DAYS_PERIOD_FILTER } from '@/modules/widget/widget-constants'
import { MemberService } from '@/modules/member/member-service'
import moment from 'moment'
import pluralize from 'pluralize'
import AppWidgetLoading from '@/modules/widget/components/v2/shared/widget-loading.vue'
import AppWidgetError from '@/modules/widget/components/v2/shared/widget-error.vue'
import AppWidgetEmpty from '@/modules/widget/components/v2/shared/widget-empty.vue'

const period = ref(SEVEN_DAYS_PERIOD_FILTER)
const activeMembers = ref([])
const loading = ref(false)
const error = ref(false)
const empty = computed(
  () =>
    !loading.value &&
    !error.value &&
    activeMembers.value.length === 0
)

onMounted(async () => {
  const response = await getActiveMembers(period.value)

  activeMembers.value = response
})

const onUpdatePeriod = async (updatedPeriod) => {
  const response = await getActiveMembers(updatedPeriod)

  activeMembers.value = response
  period.value = updatedPeriod
}

const getActiveMembers = async (selectedPeriod) => {
  loading.value = true
  error.value = false

  try {
    const response = await MemberService.list(
      {
        lastActive: {
          gte: moment()
            .startOf('day')
            .subtract(
              selectedPeriod.value,
              selectedPeriod.granularity
            )
            .toISOString()
        }
      },
      'activeDaysCount_DESC',
      10,
      0,
      false
    )

    loading.value = false

    return response.rows
  } catch (e) {
    loading.value = false
    error.value = true
    console.error(e)
    return []
  }
}

const onRowClick = () => {
  window.analytics.track('Click table widget row', {
    template: 'Members',
    widget: 'Leaderbord: Most active members'
  })
}
</script>
