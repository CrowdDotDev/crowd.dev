<template>
  <div class="py-8 px-8">
    <h4 class="text-gray-900">Eagle Eye</h4>

    <div class="text-gray-500 text-xs mt-1">
      Discover and engage with relevant content across
      various community platforms.
    </div>

    <!-- Keywords -->
    <div v-if="keywords.length" class="my-8">
      <div class="eagle-eye-settings-small-title">
        Keywords
      </div>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="keyword in keywords"
          :key="keyword"
          class="text-xs text-gray-900 px-2 h-6 flex items-center bg-white border-gray-200 border rounded-md"
        >
          {{ keyword }}
        </div>
      </div>
    </div>

    <!-- Platforms -->
    <div v-if="platforms.length">
      <div class="eagle-eye-settings-small-title">
        Platforms
      </div>
      <div class="flex flex-col gap-4">
        <div
          v-for="platform in platforms"
          :key="platform"
          class="flex items-center gap-3"
        >
          <img
            :src="platformOptions[platform].img"
            class="w-5 h-5"
          />
          <span class="text-xs text-gray-900">{{
            platformOptions[platform].label
          }}</span>
        </div>
      </div>
    </div>

    <!-- Feed Settings-->
    <el-button
      class="btn btn--full btn--md btn--secondary my-8"
      ><i class="ri-sound-module-line text-lg" /><span
        >Feed settings</span
      ></el-button
    >

    <!-- Email Digest settings -->
    <app-eagle-eye-email-digest-card />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { platformOptions } from '@/premium/eagle-eye/eagle-eye-constants'
import AppEagleEyeEmailDigestCard from '@/premium/eagle-eye/components/list/eagle-eye-email-digest-card.vue'
import { mapGetters } from '@/shared/vuex/vuex.helpers'

// TODO: Delete this
const eagleEyeSettings = {
  emailDigestActive: false,
  feed: {
    keywords: ['Machine Learning', 'Data Science'],
    exactKeywords: ['Artificial Intelligence'],
    // How to display these
    excludedKeywords: [],
    publishedDate: '',
    platforms: [
      'devto',
      'github',
      'hackernews',
      'kaggle',
      'medium',
      'producthunt'
    ]
  }
  // emailDigest: {
  //   email: '',
  //   frequency: 'daily',
  //   time: '',
  //   keywords: [],
  //   exactKeywords: [],
  //   excludedKeywords: [],
  //   publishedDate: [],
  //   platforms: [],
  //   matchFeedSettings: false
  // }
}

const { currentUser } = mapGetters('auth')

const keywords = computed(() => {
  const settings =
    currentUser.value.eagleEyeSettings || eagleEyeSettings

  if (!settings?.feed) {
    return []
  }

  const { keywords, exactKeywords } = settings.feed

  return keywords.concat(...exactKeywords)
})
const platforms = computed(() => {
  const settings =
    currentUser.value.eagleEyeSettings || eagleEyeSettings

  if (!settings?.feed) {
    return []
  }

  return settings.feed.platforms
})
</script>

<style lang="scss" scoped>
.eagle-eye-settings-small-title {
  @apply mb-3 uppercase text-gray-400 text-2xs font-semibold;
}
</style>
