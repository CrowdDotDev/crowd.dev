<template>
  <div class="dashboard-latest-widgets">
    <el-row
      type="flex"
      :gutter="16"
      class="mt-8 mb-2 justify-between items-center"
    >
      <el-col :lg="6" :md="12" :sm="24">
        <div class="font-light text-xl">Recent updates</div>
      </el-col>
    </el-row>
    <el-row type="flex" :gutter="16">
      <el-col :lg="12" :md="12" :sm="24">
        <app-widget-latest-activities />
      </el-col>
      <el-col :lg="12" :md="12" :sm="24">
        <app-widget-newest-members />
      </el-col>
    </el-row>
  </div>
</template>

<script>
import WidgetLatestActivities from '@/modules/widget/components/dashboard/widget-latest-activities'
import WidgetNewestMembers from '@/modules/widget/components/dashboard/widget-newest-members'

export default {
  name: 'AppDashboardTableWidgets',
  components: {
    'app-widget-latest-activities': WidgetLatestActivities,
    'app-widget-newest-members': WidgetNewestMembers
  }
}
</script>
