<template>
  <div>
    <div
      v-if="loading"
      v-loading="loading"
      class="app-page-spinner"
    ></div>
    <div v-else>
      <app-activity-list-feed-item
        v-for="activity in rows"
        :key="activity.id"
        :activity="activity"
      ></app-activity-list-feed-item>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppActivityListFeed'
}
</script>

<script setup>
import { useStore } from 'vuex'
import { computed, onMounted } from 'vue'

import AppActivityListFeedItem from './activity-list-feed-item'

const store = useStore()
const loading = computed(
  () => store.state.activity.list.loading
)
const rows = computed(() => store.getters['activity/rows'])

onMounted(async () => {
  await store.dispatch('activity/doFetch', {
    keepPagination: true
  })
})
</script>
