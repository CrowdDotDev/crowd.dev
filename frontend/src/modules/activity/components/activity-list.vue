<template>
  <div
    v-if="loading"
    v-loading="loading"
    class="app-page-spinner h-16 !relative !min-h-5"
  ></div>
  <div v-else>
    <app-activity-item
      v-for="activity of activities"
      :key="activity.id"
      :activity="activity"
      class="mb-6"
    />
    <div v-if="activities.length === 0">
      <p class="text-xs leading-5 text-center pt-1">
        No recent activities
      </p>
    </div>
  </div>
</template>

<script>
import AppActivityItem from '@/modules/activity/components/activity-item'
export default {
  name: 'AppActivityList',
  components: { AppActivityItem },
  props: {
    activities: {
      type: Array,
      default: () => {}
    },
    loading: {
      type: Boolean,
      default: false
    }
  }
}
</script>
