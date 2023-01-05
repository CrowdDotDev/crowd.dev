<template>
  <div class="bg-white pt-5 rounded-lg shadow">
    <div class="px-6">
      <!-- Widget Header -->
      <div
        class="flex grow justify-between items-center pb-5 mb-8 border-b border-gray-100"
      >
        <div class="flex gap-1">
          <app-widget-title
            title="Leaderbord: Most active members"
            description="Members who were active on the most days in the selected time period"
          />
        </div>
        <app-widget-period
          :period="period"
          module="reports"
          @on-update="onUpdatePeriod"
        />
      </div>

      <!-- Widget Chart -->
      <app-widget-members-table :members="activeMembers" />
    </div>

    <app-widget-insight
      description="We recommend speaking with these members, as they went above and beyond in the last 7 days. They are probably eager to share their experiences and enthusiasm for your community."
    />
  </div>
</template>

<script>
export default {
  name: 'AppWidgetActiveLeaderboardMembers'
}
</script>

<script setup>
import { ref, onMounted } from 'vue'
import AppWidgetTitle from '@/modules/widget/components/v2/shared/widget-title.vue'
import AppWidgetPeriod from '@/modules/widget/components/v2/shared/widget-period.vue'
import AppWidgetInsight from '@/modules/widget/components/v2/shared/widget-insight.vue'
import AppWidgetMembersTable from '@/modules/widget/components/v2/shared/widget-members-table.vue'
import { SEVEN_DAYS_PERIOD_FILTER } from '@/modules/widget/widget-constants'
import { MemberService } from '@/modules/member/member-service'
import moment from 'moment'

const period = ref(SEVEN_DAYS_PERIOD_FILTER)
const activeMembers = ref([])

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

    return response.rows
  } catch (e) {
    console.error(e)
    return []
  }
}
</script>
