<template>
  <div
    class="absolute top-0 left-0 w-full max-h-screen flex flex-row"
    :class="{
      'pt-[55px]': showBanner
    }"
  >
    <div
      class="basis-3/12 overflow-auto overscroll-contain"
    >
      <app-eagle-eye-settings />
    </div>

    <div
      class="basis-9/12 overflow-auto overscroll-contain"
    >
      <app-eagle-eye-tabs />
      <app-eagle-eye-loading-state
        v-if="loading && !list.length"
      />
      <app-empty-state-cta
        v-else-if="!loading && !list.length"
        :icon="emptyStateContent.icon"
        :title="emptyStateContent.title"
        :description="emptyStateContent.description"
      ></app-empty-state-cta>
      <app-eagle-eye-list v-else :list="list" />
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
const list = computed(() => store.state.eagleEye.list.posts)
const loading = computed(
  () => store.state.eagleEye.list.loading
)
const { activeView } = mapGetters('eagleEye')
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
  await store.dispatch('eagleEye/doFetch', {
    keepPagination: true
  })
})
</script>
