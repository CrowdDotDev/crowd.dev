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
      <div v-if="activeMembers.length" class="my-8">
        <router-link
          v-for="member in activeMembers"
          :key="member.id"
          class="h-14 border-b border-gray-100 last:border-none grid grid-cols-4 hover:bg-gray-50 hover:cursor-pointer group"
          :to="{
            name: 'memberView',
            params: { id: member.id }
          }"
        >
          <div class="flex gap-3 items-center">
            <app-avatar :entity="member" size="sm" />
            <div class="flex flex-col">
              <span
                class="font-medium text-xs text-gray-900"
                >{{ member.displayName }}</span
              >
              <span
                v-if="member.organizations?.length"
                class="text-gray-500 text-2xs"
                >{{ member.organizations?.[0]?.name }}</span
              >
            </div>
          </div>

          <div
            class="text-xs text-gray-500 italic flex items-center"
          >
            6 days active
          </div>

          <div class="flex gap-3 items-center">
            <div
              v-for="platform in Object.keys(
                member.username || {}
              )"
              :key="platform"
            >
              <el-tooltip
                popper-class="custom-identity-tooltip"
                placement="top"
              >
                <template #content
                  ><span
                    ><span class="capitalize">{{
                      platform
                    }}</span
                    >profile
                    <i
                      v-if="
                        member.attributes?.url?.[platform]
                      "
                      class="ri-external-link-line text-gray-400"
                    ></i></span
                ></template>

                <a
                  :href="
                    member.attributes?.url?.[platform] ||
                    null
                  "
                  target="_blank"
                  class="hover:cursor-pointer"
                  :style="{
                    minWidth: '32px'
                  }"
                  @click.stop
                >
                  <app-svg
                    :name="platform"
                    class="max-w-[16px] h-4"
                    color="#D1D5DB"
                  /> </a
              ></el-tooltip>
            </div>
          </div>

          <div
            class="inline-flex items-center justify-end mr-4 invisible group-hover:visible font-medium text-2xs text-gray-600 gap-1"
          >
            <span>Profile</span>
            <i class="ri-arrow-right-s-line" />
          </div>
        </router-link>
      </div>

      <div
        v-else
        class="w-full text-center h-20 flex items-center justify-center mb-8 text-gray-500 text-sm"
      >
        No data for this time period
      </div>
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
import { SEVEN_DAYS_PERIOD_FILTER } from '@/modules/widget/widget-constants'
import { MemberService } from '@/modules/member/member-service'
import moment from 'moment'
import AppSvg from '@/shared/svg/svg.vue'

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
        and: [
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
          }
        ]
      },
      'activityCount_DESC',
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
