<template>
  <div class="py-8 px-8">
    <h4 class="text-gray-900">Eagle Eye</h4>

    <div class="text-gray-500 text-xs mt-1">
      Discover and engage with relevant content across
      various community platforms.
    </div>

    <!-- Keywords -->
    <div
      v-if="keywords.length || exactKeywords.length"
      class="my-8"
    >
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
        <div
          v-for="exactKeyword in exactKeywords"
          :key="exactKeyword"
          class="text-xs text-gray-900 px-2 h-6 flex items-center bg-white border-gray-200 border rounded-md"
        >
          "{{ exactKeyword }}"
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
      @click="settingsDrawerOpen = true"
      ><i class="ri-sound-module-line text-lg" /><span
        >Feed settings</span
      ></el-button
    >

    <!-- Email Digest settings -->
    <app-eagle-eye-email-digest-card />
    <app-eagle-eye-settings-drawer
      v-model="settingsDrawerOpen"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import platformOptions from '@/premium/eagle-eye/constants/eagle-eye-platforms.json'
import AppEagleEyeEmailDigestCard from '@/premium/eagle-eye/components/list/eagle-eye-email-digest-card.vue'
import AppEagleEyeSettingsDrawer from '@/premium/eagle-eye/components/list/eagle-eye-settings-drawer.vue'
import { mapGetters } from '@/shared/vuex/vuex.helpers'

const { currentUser } = mapGetters('auth')

const settingsDrawerOpen = ref(false)

const keywords = computed(() => {
  const { eagleEyeSettings } = currentUser.value

  if (!eagleEyeSettings?.feed) {
    return []
  }

  return eagleEyeSettings.feed.keywords
})
const exactKeywords = computed(() => {
  const { eagleEyeSettings } = currentUser.value

  if (!eagleEyeSettings?.feed) {
    return []
  }

  return eagleEyeSettings.feed.exactKeywords
})
const platforms = computed(() => {
  const { eagleEyeSettings } = currentUser.value

  if (!eagleEyeSettings?.feed) {
    return []
  }

  return eagleEyeSettings.feed.platforms
})
</script>

<style lang="scss" scoped>
.eagle-eye-settings-small-title {
  @apply mb-3 uppercase text-gray-400 text-2xs font-semibold;
}
</style>
