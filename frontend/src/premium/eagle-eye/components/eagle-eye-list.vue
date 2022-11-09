<template>
  <div class="eagle-eye-list">
    <div v-if="count > 0">
      <transition-group name="fade" mode="out-in">
        <app-eagle-eye-list-item
          v-for="record in rows"
          :key="record.id"
          :record="record"
        />
      </transition-group>
      <div
        v-if="rows.length && isLoadMoreVisible"
        class="flex grow justify-center pt-4"
      >
        <div
          v-if="loading"
          v-loading="loading"
          class="app-page-spinner h-16 !relative !min-h-5"
        ></div>
        <el-button
          v-else
          class="btn btn-link btn-link--primary"
          @click="handleLoadMore"
          ><i class="ri-arrow-down-line"></i
          ><span class="text-xs">Load more</span></el-button
        >
      </div>
    </div>

    <app-empty-state-cta
      v-else
      icon="ri-folder-3-line"
      :title="computedEmptyStateCopy"
    ></app-empty-state-cta>
  </div>
</template>

<script>
export default {
  name: 'AppEagleEyeList'
}
</script>

<script setup>
import AppEagleEyeListItem from './eagle-eye-list-item'
import { useStore } from 'vuex'
import { computed } from 'vue'

const store = useStore()

const count = computed(() => store.state.eagleEye.count)
const rows = computed(() => store.getters['eagleEye/rows'])
const activeView = computed(
  () => store.getters['eagleEye/activeView']
)
const loading = computed(
  () => store.state.eagleEye.list.loading
)
const pagination = computed(
  () => store.getters['activity/pagination']
)
const isLoadMoreVisible = computed(() => {
  return (
    pagination.value.currentPage *
      pagination.value.pageSize <
    count.value
  )
})
const computedEmptyStateCopy = computed(() => {
  if (
    activeView.value.filter.keywords &&
    activeView.value.filter.keywords.length > 0
  ) {
    return 'No posts found based on your search criteria'
  } else if (activeView.value.id === 'excluded') {
    return 'No excluded posts'
  } else if (activeView.value.id === 'engaged') {
    return 'No engaged posts'
  } else {
    return 'No posts found'
  }
})

const handleLoadMore = async () => {
  await store.dispatch('eagleEye/doFetch', {
    keepPagination: true
  })
}
</script>
