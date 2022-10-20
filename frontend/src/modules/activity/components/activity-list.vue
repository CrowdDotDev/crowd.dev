<template>
  <div v-if="!!count" class="mb-2">
    <app-pagination-sorter
      v-model="sorterFilter"
      :page-size="Number(pagination.pageSize)"
      :total="count"
      :current-page="pagination.currentPage"
      :has-page-counter="false"
      module="activity"
      position="top"
      @change-sorter="doChangeFilter"
    />
  </div>
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
export default {
  name: 'AppActivityList'
}
</script>

<script setup>
import AppActivityItem from '@/modules/activity/components/activity-item'
import { defineProps, computed, ref } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const sorterFilter = ref('trending')

defineProps({
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
})

const count = computed(() => store.state.activity.count)
const pagination = computed(
  () => store.getters['activity/pagination']
)

function doChangeFilter(filter) {
  console.log(filter)
}
</script>
