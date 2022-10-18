<template>
  <div class="pt-3">
    <div v-if="activities.loading">
      <app-dashboard-activities-item
        v-for="el of new Array(3)"
        :key="el"
        :loading="true"
      />
    </div>
    <div v-else>
      <app-dashboard-activities-item
        v-for="(activity, ai) of recentActivities"
        :key="activity.id"
        :class="{
          'border-b': ai < recentActivities.length - 1
        }"
        :activity="activity"
      />
      <div v-if="recentActivities.length === 0">
        <p class="text-xs leading-5 text-center pt-1">
          No recent activities during this period
        </p>
      </div>
    </div>
    <div class="pt-3 pb-2 flex justify-center">
      <router-link
        :to="{ name: 'activity' }"
        class="text-red font-medium text-center text-xs leading-5"
      >
        All activities
      </router-link>
    </div>
  </div>
</template>

<script>
import AppDashboardActivitiesItem from '@/modules/dashboard/components/activities/dashboard-activities-item'
import { mapGetters } from 'vuex'
export default {
  name: 'AppDashboardActivitiesList',
  components: { AppDashboardActivitiesItem },
  emits: { count: null },
  computed: {
    ...mapGetters('dashboard', [
      'recentActivities',
      'activities'
    ])
  }
}
</script>
