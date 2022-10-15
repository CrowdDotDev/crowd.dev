<template>
  <div class="widget panel">
    <!-- header -->
    <div class="flex items-center">
      <div
        class="w-10 h-10 rounded-md bg-gray-900 flex items-center justify-center mr-4"
      >
        <i class="ri-radar-line text-xl text-white"></i>
      </div>
      <div>
        <h6 class="text-base font-semibold leading-5">
          Activities
        </h6>
      </div>
    </div>

    <div class="pt-6 flex -mx-5 pb-12">
      <div class="w-7/12 px-5 pb-4">
        <!-- Chart -->
        <div>Chart</div>
      </div>
      <div class="w-5/12 px-5 pb-4">
        <p
          class="text-2xs leading-5 font-semibold text-gray-400 mb-3 tracking-1 uppercase"
        >
          Total
        </p>
        <div class="flex items-center pb-6">
          <p class="text-sm font-medium mr-2">
            4,600 activities
          </p>
          <app-dashboard-badge>+2%</app-dashboard-badge>
        </div>
        <p
          class="text-2xs leading-5 font-semibold text-gray-400 mb-3 tracking-1 uppercase"
        >
          OVERALL SENTIMENT
        </p>
        <div class="flex w-full pb-3">
          <div
            class="h-2 bg-green-500 border-l border-r rounded-sm"
            :style="{ width: `${60}%` }"
          ></div>
          <div
            class="h-2 bg-red-500 border-l border-r rounded-sm"
            :style="{ width: `${40}%` }"
          ></div>
        </div>
        <div class="flex justify-between pb-2">
          <p class="text-sm font-medium">Positive</p>
          <p class="text-xs text-gray-600 text-right">
            600・60%
          </p>
        </div>
        <div class="flex justify-between">
          <p class="text-sm font-medium">Negative</p>
          <p class="text-xs text-gray-600 text-right">
            400・40%
          </p>
        </div>
      </div>
    </div>

    <div class="tabs">
      <el-tabs v-model="tab">
        <el-tab-pane
          label="Trending conversations"
          name="trending"
        >
          <app-dashboard-conversations-list />
        </el-tab-pane>
        <el-tab-pane
          label="Recent activities"
          name="recent"
        >
          <app-dashboard-activities-list />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script>
import AppDashboardActivitiesList from '@/modules/dashboard/components/activities/dashboard-activities-list'
import AppDashboardConversationsList from '@/modules/dashboard/components/conversations/dashboard-conversations-list'
import AppDashboardBadge from '@/modules/dashboard/components/shared/dashboard-badge'
export default {
  name: 'AppDashboardActivities',
  components: {
    AppDashboardBadge,
    AppDashboardConversationsList,
    AppDashboardActivitiesList
  },
  data() {
    return {
      tab: 'trending'
    }
  }
}
</script>

<style scoped lang="scss">
.tabs::v-deep {
  .el-tabs__content {
    overflow: visible;
  }
}
</style>
