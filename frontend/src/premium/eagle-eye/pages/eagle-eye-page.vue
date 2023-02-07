<template>
  <app-page-wrapper size="narrow">
    <div class="eagle-eye">
      <div class="eagle-eye-header">
        <div class="flex items-center">
          <h4>Eagle Eye</h4>
          <span
            v-if="currentTenant.isTrialPlan"
            class="badge badge--sm badge--light-yellow ml-4"
            >Growth (trial)</span
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
          src="/images/empty-state/eagle-eye.svg"
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
    <app-eagle-eye-email-digest
      v-model="emailDigestDrawerOpen"
    ></app-eagle-eye-email-digest>
  </app-page-wrapper>
</template>

<script>
export default {
  name: 'AppEagleEye'
}
</script>

<script setup>
import AppEagleEyeTabs from '../components/eagle-eye-tabs'
import AppEagleEyeList from '../components/eagle-eye-list'
import AppEagleEyeFilter from '../components/eagle-eye-filter'
import AppEagleEyeEmailDigest from '../components/eagle-eye-email-digest'

import { useStore } from 'vuex'
import { computed, ref } from 'vue'

const store = useStore()

const emailDigestDrawerOpen = ref(true)

const loading = computed(
  () => store.state.eagleEye.list.loading
)
const activeView = computed(
  () => store.getters['eagleEye/activeView'].id
)
const currentTenant = computed(
  () => store.getters['auth/currentTenant']
)

const shouldRenderInboxEmptyState = computed(() => {
  return (
    !localStorage.getItem('eagleEye_keywords') &&
    !loading.value &&
    activeView.value === 'inbox'
  )
})
</script>
