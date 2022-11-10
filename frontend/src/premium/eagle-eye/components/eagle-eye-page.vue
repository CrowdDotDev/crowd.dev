<template>
  <app-page-wrapper>
    <div class="eagle-eye">
      <div class="eagle-eye-header">
        <div class="flex items-start">
          <h4>Eagle Eye</h4>
          <span
            class="text-sm font-medium text-brand-500 ml-2"
            >Free trial</span
          >
        </div>
        <div class="text-xs text-gray-500">
          Discover and engage with relevant content across
          various community platforms.
        </div>
      </div>
      <app-eagle-eye-tabs class="mt-10" />
      <app-eagle-eye-filter />
      <div
        v-if="shouldRenderInboxEmptyState"
        class="flex flex-col items-center justify-center w-full py-10"
      >
        <img
          src="/images/eagle-eye-empty-state.svg"
          alt=""
          class="w-80"
        />
        <div class="text-xl font-medium mt-10">
          Stop scrolling, start engaging
        </div>
        <div class="text-gray-600 text-sm mt-6">
          Find relevant content across community platforms
        </div>
      </div>
      <div v-else>
        <app-eagle-eye-list />
      </div>
    </div>
  </app-page-wrapper>
</template>

<script>
export default {
  name: 'AppEagleEye'
}
</script>

<script setup>
import AppPageWrapper from '@/modules/layout/components/page-wrapper'
import AppEagleEyeTabs from './eagle-eye-tabs'
import AppEagleEyeList from './eagle-eye-list'
import AppEagleEyeFilter from './eagle-eye-filter'

import { useStore } from 'vuex'
import { computed } from 'vue'

const store = useStore()

const loading = computed(
  () => store.state.eagleEye.list.loading
)
const activeView = computed(
  () => store.getters['eagleEye/activeView'].id
)
const shouldRenderInboxEmptyState = computed(() => {
  return (
    localStorage.getItem('eagleEye_keywords') === null &&
    !loading.value &&
    activeView.value.id === 'inbox'
  )
})
</script>
