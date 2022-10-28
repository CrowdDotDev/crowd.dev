<template>
  <div class="pt-3">
    <div v-if="activities.loading">
      <app-dashboard-activity-item
        v-for="el of new Array(4)"
        :key="el"
        :loading="true"
      />
    </div>
    <div v-else>
      <app-dashboard-activity-item
        v-for="(activity, ai) of recentActivities"
        :key="activity.id"
        :class="{
          'border-b': ai < recentActivities.length - 1
        }"
        :activity="activity"
      />
      <div
        v-if="recentActivities.length === 0"
        class="flex items-center justify-center pt-17 pb-17"
      >
        <i
          class="ri-list-check-2 flex items-center text-3xl h-12 text-gray-300"
        ></i>
        <p
          class="text-sm leading-5 text-center italic text-gray-400 pl-6"
        >
          No activities during this period
        </p>
      </div>
    </div>
    <div class="pt-3 pb-2 flex justify-center">
      <router-link
        :to="{
          name: 'activity',
          query: { activeTab: 'activities' }
        }"
        class="text-red font-medium text-center text-xs leading-5"
      >
        All activities
      </router-link>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import AppDashboardActivityItem from '@/modules/dashboard/components/activity/dashboard-activity-item'
export default {
  name: 'AppDashboardActivityList',
  components: { AppDashboardActivityItem },
  emits: { count: null },
  computed: {
    ...mapGetters('dashboard', [
      'recentActivities',
      'activities'
    ])
  }
}
</script>
