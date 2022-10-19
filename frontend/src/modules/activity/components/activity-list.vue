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
      v-bind="cardOptions"
    />
    <div v-if="activities.length === 0">
      <div class="flex justify-center pt-12">
        <i
          class="ri-list-check-2 text-4xl h-12 text-gray-300"
        ></i>
      </div>
      <p
        class="text-xs leading-5 text-center italic text-gray-400 pt-4 pb-12"
      >
        There are no activities
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
    },
    cardOptions: {
      type: Object,
      required: false,
      default: () => ({})
    }
  }
}
</script>
