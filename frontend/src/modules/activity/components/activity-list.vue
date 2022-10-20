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
  cardOptions: {
    type: Object,
    required: false,
    default: () => ({})
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
