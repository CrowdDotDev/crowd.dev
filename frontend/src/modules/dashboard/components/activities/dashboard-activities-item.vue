<template>
  <article class="py-5 border-gray-200 relative">
    <div class="flex">
      <!-- avatar -->
      <div class="pr-3">
        <router-link
          :to="{
            name: 'memberView',
            params: { id: activity.member.id }
          }"
          target="_blank"
        >
          <app-avatar :entity="activity.member" size="xs" />
        </router-link>
      </div>
      <div class="flex-grow w-full">
        <!-- Name -->
        <div class="flex justify-between w-full">
          <div>
            <router-link
              :to="{
                name: 'memberView',
                params: { id: activity.member.id }
              }"
              class="text-2xs leading-4 block text-gray-600 pb-0.5"
            >
              {{ activity.member.displayName }}
            </router-link>
            <div class="flex items-center">
              <div>
                <el-tooltip
                  effect="dark"
                  :content="platform.name"
                  placement="top"
                >
                  <img
                    :alt="platform.name"
                    class="w-4 h-4"
                    :src="platform.image"
                  />
                </el-tooltip>
              </div>
              <div class="text-2xs leading-4 pl-2 flex">
                <app-dashboard-activities-message
                  :activity="activity"
                /><span
                  class="whitespace-nowrap text-gray-500"
                  ><span class="mx-1">·</span
                  >{{ timeAgo }}</span
                >
              </div>
            </div>
          </div>
          <div>
            <app-activity-dropdown :activity="activity" />
          </div>
        </div>
        <!-- Content -->
        <app-dashboard-activities-content
          class="text-xs"
          :activity="activity"
        />
      </div>
    </div>
  </article>
</template>

<script>
import AppAvatar from '@/shared/avatar/avatar'
import integrationsJsonArray from '@/jsons/integrations.json'
import AppDashboardActivitiesMessage from '@/modules/dashboard/components/activities/dashboard-activities-message'
import computedTimeAgo from '@/utils/time-ago'
import AppDashboardActivitiesContent from '@/modules/dashboard/components/activities/dashboard-activities-content'
import AppActivityDropdown from '@/modules/activity/components/activity-dropdown'

export default {
  name: 'AppDashboardActivitiesItem',
  components: {
    AppActivityDropdown,
    AppDashboardActivitiesContent,
    AppDashboardActivitiesMessage,
    AppAvatar
  },
  props: {
    activity: {
      type: Object,
      required: true
    }
  },
  computed: {
    platform() {
      return integrationsJsonArray.find(
        (i) => i.platform === this.activity.platform
      )
    },
    timeAgo() {
      return computedTimeAgo(this.activity.timestamp)
    }
  }
}
</script>
