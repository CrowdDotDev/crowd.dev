<template>
  <div
    v-if="!isEmailDigestConfiguredOnce"
    class="bg-purple-50 rounded-lg p-5 shadow"
  >
    <div class="flex items-center gap-2">
      <i class="ri-mail-open-line text-lg text-gray-900" />
      <span class="text-gray-900 font-semibold text-sm"
        >Email Digest</span
      >
    </div>

    <div class="text-2xs text-gray-600 mt-4 mb-6">
      Receive automatically in your inbox a collection of up
      to 10 most relevant results from Eagle Eye.
    </div>

    <el-button class="btn btn--primary btn--full !h-8"
      >Activate Email Digest</el-button
    >
  </div>

  <div
    v-else
    class="bg-white rounded-lg shadow px-3 py-2 flex justify-between items-center"
  >
    <div class="flex items-center gap-3">
      <i class="ri-mail-open-line text-lg text-gray-900" />
      <div class="flex flex-col">
        <span class="text-gray-900 font-medium text-xs"
          >Email Digest</span
        >
        <span
          class="text-2xs"
          :class="{
            'text-gray-500': !isEmailDigestActivated,
            'text-green-600': isEmailDigestActivated
          }"
          >{{
            isEmailDigestActivated
              ? 'Active'
              : 'Deactivated'
          }}</span
        >
      </div>
    </div>

    <el-button class="btn btn--transparent !h-8 !w-8">
      <i class="ri-sound-module-line text-base" />
    </el-button>
  </div>
</template>

<script setup>
import { mapGetters } from '@/shared/vuex/vuex.helpers'
import { computed } from 'vue'

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
const isEmailDigestConfiguredOnce = computed(() => {
  const settings =
    currentUser.value.eagleEyeSettings || eagleEyeSettings

  return !!Object.keys(settings.emailDigest || {}).length
})
const isEmailDigestActivated = computed(() => {
  const settings =
    currentUser.value.eagleEyeSettings || eagleEyeSettings

  return settings.emailDigestActive
})
</script>
