<template>
  <div class="eagle-eye-list">
    <div
      v-if="loading && !rows.length"
      v-loading="loading"
      class="app-page-spinner h-16 !relative !min-h-5"
    ></div>
    <div v-else>
      <!-- Empty State -->
      <app-empty-state-cta
        v-if="rows.length === 0"
        icon="ri-folder-3-line"
        :title="computedEmptyStateCopy"
      ></app-empty-state-cta>

      <div v-else>
        <!-- Sorter and counter -->
        <div class="flex justify-between items-center py-3">
          <app-eagle-eye-counter />
          <app-eagle-eye-sorter
            v-if="activeView === 'inbox'"
          />
        </div>

        <!-- Eagle eye items list -->
        <transition-group name="fade" mode="out-in">
          <app-eagle-eye-list-item
            v-for="record in rows"
            :key="record.id"
            :record="record"
          />
        </transition-group>

        <!-- Load more button -->
        <div
          v-if="isLoadMoreVisible || loading"
          class="flex grow justify-center pt-4"
        >
          <div
            v-if="loading"
            v-loading="loading"
            class="app-page-spinner h-16 w-16 !relative !min-h-fit"
          ></div>
          <el-button
            v-else
            class="btn btn-link btn-link--primary"
            @click="handleLoadMore"
            ><i class="ri-arrow-down-line"></i
            ><span class="text-xs"
              >Load more</span
            ></el-button
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppEagleEyeList'
}
</script>

<script setup>
import AppEagleEyeListItem from './eagle-eye-list-item'
import AppEagleEyeCounter from './eagle-eye-counter'
import AppEagleEyeSorter from './eagle-eye-sorter'
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
  () => store.getters['eagleEye/pagination']
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
  await store.dispatch(
    'eagleEye/doChangePaginationCurrentPage',
    pagination.value.currentPage + 1
  )
}
</script>
