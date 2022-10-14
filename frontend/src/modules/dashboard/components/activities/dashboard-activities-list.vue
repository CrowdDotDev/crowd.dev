<template>
  <div class="pt-3">
    <app-dashboard-activities-item
      v-for="(activity, ai) of activities"
      :key="activity.id"
      :class="{ 'border-b': ai < activities.length - 1 }"
      :activity="activity"
    />
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
import { ActivityService } from '@/modules/activity/activity-service'
export default {
  name: 'AppDashboardActivitiesList',
  components: { AppDashboardActivitiesItem },
  emits: { count: null },
  data() {
    return {
      activities: [],
      loading: false
    }
  },
  mounted() {
    this.fetchActivities()
  },
  methods: {
    async fetchActivities() {
      if (this.loading) {
        return
      }
      this.loading = true
      ActivityService.list(null, 'createdAt_ASC', 20, 0)
        .then(({ rows, count }) => {
          this.activities = rows
          this.$emit('count', count)
        })
        .finally(() => {
          this.loading = false
        })
    }
  }
}
</script>
