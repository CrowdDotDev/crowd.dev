<template>
  <div class="member-view-aside panel">
    <div>
      <div class="flex items-center justify-between">
        <div class="font-medium text-black">Identities</div>
      </div>
      <div class="-mx-6 mt-6">
        <a
          class="px-6 py-2 flex justify-between items-center relative"
          :class="
            organization.url &&
            organization.activeOn.includes('github')
              ? 'hover:bg-gray-50 transition-colors cursor-pointer'
              : ''
          "
          :href="organization.url"
          target="_blank"
        >
          <div class="flex gap-3 items-center">
            <app-platform platform="github" />
            <span class="text-gray-900 text-xs">
              GitHub</span
            >
          </div>
          <i
            v-if="organization.url"
            class="ri-external-link-line text-gray-300"
          ></i>
        </a>
        <a
          v-if="organization.twitter"
          class="px-6 py-2 flex justify-between items-center relative"
          :class="
            organization.twitter &&
            organization.activeOn.includes('twitter')
              ? 'hover:bg-gray-50 transition-colors cursor-pointer'
              : ''
          "
          :href="organization.twitter"
          target="_blank"
        >
          <div class="flex gap-3 items-center">
            <app-platform platform="twitter" />
            <span class="text-gray-900 text-xs">
              Twitter</span
            >
          </div>
          <i
            v-if="organization.twitter"
            class="ri-external-link-line text-gray-300"
          ></i>
        </a>
        <a
          v-if="organization.linkedin"
          class="px-6 py-2 flex justify-between items-center relative"
          :class="
            organization.linkedin &&
            organization.activeOn.includes('linkedin')
              ? 'hover:bg-gray-50 transition-colors cursor-pointer'
              : ''
          "
          :href="organization.linkedin"
          target="_blank"
        >
          <div class="flex gap-3 items-center">
            <app-platform platform="linkedin" />
            <span class="text-gray-900 text-xs">
              LinkedIn</span
            >
          </div>
          <i
            v-if="organization.linkedin"
            class="ri-external-link-line text-gray-300"
          ></i>
        </a>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppMemberViewAside'
}
</script>

<script setup>
import { defineProps } from 'vue'

defineProps({
  organization: {
    type: Object,
    default: () => {}
  }
})
</script>
