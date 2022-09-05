<template>
  <div class="eagle-eye">
    <app-eagle-eye-header />
    <div class="container">
      <app-eagle-eye-search />
      <div
        v-if="shouldRenderEmptyState"
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
      <div
        class="app-page-spinner"
        v-else-if="loading"
        v-loading="loading"
      ></div>
      <div v-else>
        <div class="flex justify-between items-center pt-4">
          <app-eagle-eye-counter />
          <app-eagle-eye-sorter
            v-if="activeTab === 'inbox'"
          />
        </div>
        <app-eagle-eye-list />
      </div>
    </div>
  </div>
</template>

<script>
import AppEagleEyeHeader from './eagle-eye-header'
import AppEagleEyeList from './eagle-eye-list'
import AppEagleEyeCounter from './eagle-eye-counter'
import AppEagleEyeSorter from './eagle-eye-sorter'
import AppEagleEyeSearch from './eagle-eye-search'

import { mapGetters } from 'vuex'

export default {
  name: 'app-eagle-eye',
  components: {
    AppEagleEyeHeader,
    AppEagleEyeList,
    AppEagleEyeCounter,
    AppEagleEyeSorter,
    AppEagleEyeSearch
  },
  computed: {
    ...mapGetters({
      activeTab: 'eagleEye/activeTab',
      loading: 'eagleEye/loading'
    }),
    shouldRenderEmptyState() {
      return (
        localStorage.getItem('eagleEye_keywords') ===
          null &&
        !this.loading &&
        this.activeTab === 'inbox'
      )
    }
  }
}
</script>

<style lang="scss">
.eagle-eye {
  @apply -m-6;
  .container {
    @apply block;
  }
}
</style>
