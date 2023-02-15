<template>
  <div
    class="absolute top-0 left-0 w-full max-h-screen flex flex-row"
    :class="{
      'pt-[55px]': showBanner
    }"
  >
    <div
      :style="cssVars"
      class="md:basis-3/12 lg:basis-4/12 overflow-auto overscroll-contain eagle-eye-settings-wrapper"
    >
      <app-eagle-eye-settings />
    </div>

    <div
      class="md:basis-9/12 lg:basis-8/12 overflow-auto overscroll-contain"
    >
      <div :style="cssVars" class="eagle-eye-list-wrapper">
        <app-eagle-eye-tabs />
        <app-eagle-eye-loading-state v-if="isLoading" />
        <app-empty-state-cta
          v-else-if="showEmptyState"
          :icon="emptyStateContent.icon"
          :title="emptyStateContent.title"
          :description="emptyStateContent.description"
        ></app-empty-state-cta>
        <app-eagle-eye-list v-else :list="list" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppEagleEye'
}
</script>

<script setup>
import AppEagleEyeTabs from '@/premium/eagle-eye/components/list/eagle-eye-tabs.vue'
import AppEagleEyeSettings from '@/premium/eagle-eye/components/list/eagle-eye-settings.vue'
import AppEagleEyeList from '@/premium/eagle-eye/components/list/eagle-eye-list.vue'
import AppEagleEyeLoadingState from '@/premium/eagle-eye/components/list/eagle-eye-loading-state.vue'
import { mapGetters } from '@/shared/vuex/vuex.helpers'
import { computed, onMounted } from 'vue'
import { useStore } from 'vuex'

const { showBanner } = mapGetters('tenant')

const store = useStore()

const { activeView, activeViewList } =
  mapGetters('eagleEye')

const cssVars = computed(() => {
  const isMenuCollapsed =
    store.getters['layout/menuCollapsed']
  const menuWidth = isMenuCollapsed ? '64px' : '260px'

  return {
    '--eagle-eye-padding': menuWidth
  }
})
const list = computed(() => activeViewList.value.posts)
const isLoading = computed(() => {
  if (activeView.value.id === 'feed') {
    return activeViewList.value.loading
  }

  return activeViewList.value.loading && !list.value.length
})
const showEmptyState = computed(
  () => !activeViewList.value.loading && !list.value.length
)
const emptyStateContent = computed(() => {
  if (activeView.value.id === 'feed') {
    return {
      icon: 'ri-search-eye-line',
      title: 'No results found',
      description: 'Try to refine your feed settings'
    }
  }

  return {
    icon: 'ri-bookmark-line',
    title: 'No bookmarks yet',
    description: 'Bookmarked results will appear here'
  }
})

onMounted(async () => {
  // Prevent new fetch if it still loading results from onboarding
  if (!activeViewList.value.loading) {
    await store.dispatch('eagleEye/doFetch', {
      keepPagination: true,
      resetStorage: false
    })
  }
})
</script>

<style>
.eagle-eye-list-wrapper {
  padding-right: calc(
    calc(calc(100vw - var(--eagle-eye-padding)) - 72rem) / 2
  );
}

.eagle-eye-settings-wrapper {
  padding-left: calc(
    calc(calc(100vw - var(--eagle-eye-padding)) - 72rem) / 2
  );
}
</style>
