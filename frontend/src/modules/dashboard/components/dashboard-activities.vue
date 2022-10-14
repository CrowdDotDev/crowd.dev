<template>
  <div class="widget panel">
    <!-- Header -->
    <div class="flex justify-between">
      <div class="flex items-center">
        <div
          class="w-10 h-10 rounded-md bg-gray-900 flex items-center justify-center mr-4"
        >
          <i class="ri-radar-line text-xl text-white"></i>
        </div>
        <div>
          <h6
            class="text-base font-semibold leading-5 mb-0.5"
          >
            Activities
          </h6>
          <p class="text-xs leading-5 text-gray-600">
            Total: 2,450
          </p>
        </div>
      </div>
      <div>
        <!-- TODO: filters -->
      </div>
    </div>

    <!-- Chart -->
    <div>Chart</div>

    <el-tabs
      v-model="tab"
      class="demo-tabs"
      @tab-click="handleClick"
    >
      <el-tab-pane
        label="Trending conversations"
        name="trending"
      >
        <div class="pt-3"></div>
      </el-tab-pane>
      <el-tab-pane label="Recent activities" name="recent">
        <app-dashboard-activities-list />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import AppDashboardActivitiesList from '@/modules/dashboard/components/activities/dashboard-activities-list'
export default {
  name: 'AppDashboardActivities',
  components: { AppDashboardActivitiesList },
  data() {
    return {
      tab: 'trending'
    }
  }
}
</script>
