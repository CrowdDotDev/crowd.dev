<template>
  <div class="pt-3">
    <app-dashboard-activities-item
      v-for="activity of activities"
      :key="activity.id"
      :activity="activity"
    />
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
  created() {
    this.fetchActivities()
  },
  methods: {
    async fetchActivities() {
      if (this.loading) {
        return
      }
      this.loading = true
      ActivityService.list(null, 'createdAt_DESC', 10, 0)
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
