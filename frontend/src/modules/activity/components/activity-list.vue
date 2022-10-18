<template>
  <div class="pt-3">
    <div
      v-if="loading"
      v-loading="loading"
      class="app-page-spinner h-16 !relative !min-h-5"
    ></div>
    <div v-else>
      <app-activity-item
        v-for="(activity, ai) of activities"
        :key="activity.id"
        :class="{
          'border-b': ai < activities.length - 1
        }"
        :activity="activity"
        :is-card="itemsAsCards"
      />
      <div v-if="activities.length === 0">
        <p class="text-xs leading-5 text-center pt-1">
          No recent activities during this period
        </p>
      </div>
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
    },
    itemsAsCards: {
      type: Boolean,
      default: false
    }
  }
}
</script>
