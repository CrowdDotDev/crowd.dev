<template>
  <div class="member-view-aside panel">
    <div>
      <div class="flex items-center justify-between">
        <div class="font-medium text-black">Identities</div>
      </div>
      <div class="-mx-6 mt-6">
        <a
          v-if="
            organization.github?.url || organization.url
          "
          class="px-6 py-2 flex justify-between items-center relative"
          :class="
            organization.github?.url &&
            organization.activeOn.includes('github')
              ? 'hover:bg-gray-50 transition-colors cursor-pointer'
              : ''
          "
          :href="organization.github?.url"
          target="_blank"
        >
          <div class="flex gap-3 items-center">
            <app-platform platform="github" />
            <span class="text-gray-900 text-xs">
              GitHub</span
            >
          </div>
          <i
            v-if="
              organization.github?.url &&
              organization.activeOn.includes('github')
            "
            class="ri-external-link-line text-gray-300"
          ></i>
        </a>
        <a
          v-if="organization.twitter?.url"
          class="px-6 py-2 flex justify-between items-center relative"
          :class="
            organization.twitter?.url &&
            organization.activeOn.includes('twitter')
              ? 'hover:bg-gray-50 transition-colors cursor-pointer'
              : ''
          "
          :href="organization.twitter.url"
          target="_blank"
        >
          <div class="flex gap-3 items-center">
            <app-platform platform="twitter" />
            <span class="text-gray-900 text-xs">
              Twitter</span
            >
          </div>
          <i
            v-if="
              organization.twitter?.url &&
              organization.activeOn.includes('twitter')
            "
            class="ri-external-link-line text-gray-300"
          ></i>
        </a>
        <a
          v-if="organization.linkedin?.url"
          class="px-6 py-2 flex justify-between items-center relative"
          :class="
            organization.linkedin?.url &&
            organization.activeOn.includes('linkedin')
              ? 'hover:bg-gray-50 transition-colors cursor-pointer'
              : ''
          "
          :href="organization.linkedin.url"
          target="_blank"
        >
          <div class="flex gap-3 items-center">
            <app-platform platform="linkedin" />
            <span class="text-gray-900 text-xs">
              LinkedIn</span
            >
          </div>
          <i
            v-if="
              organization.linkedin?.url &&
              organization.activeOn.includes('linkedin')
            "
            class="ri-external-link-line text-gray-300"
          ></i>
        </a>
        <a
          v-if="organization.crunchbase?.url"
          class="px-6 py-2 flex justify-between items-center relative"
          :class="
            organization.crunchbase?.url &&
            organization.activeOn.includes('crunchbase')
              ? 'hover:bg-gray-50 transition-colors cursor-pointer'
              : ''
          "
          :href="organization.crunchbase.url"
          target="_blank"
        >
          <div class="flex gap-3 items-center">
            <app-platform platform="crunchbase" />
            <span class="text-gray-900 text-xs">
              Crunchbase</span
            >
          </div>
          <i
            v-if="
              organization.crunchbase?.url &&
              organization.activeOn.includes('crunchbase')
            "
            class="ri-external-link-line text-gray-300"
          ></i>
        </a>
        <el-divider
          v-if="
            (organization.emails &&
              organization.emails.length > 0) ||
            (organization.phoneNumbers &&
              organization.phoneNumbers.length > 0)
          "
          class="border-t-gray-200"
        ></el-divider>
        <a
          v-for="email of organization.emails"
          :key="email"
          class="px-6 py-2 flex justify-between items-center relative hover:bg-gray-50 transition-colors cursor-pointer"
          :href="`mailto:${email}`"
          target="_blank"
        >
          <div class="flex gap-3 items-center">
            <app-platform platform="email" />
            <span class="text-gray-900 text-xs">
              {{ email }}</span
            >
          </div>
          <i
            class="ri-external-link-line text-gray-300"
          ></i>
        </a>
        <a
          v-for="phone of organization.phoneNumbers"
          :key="phone"
          class="px-6 py-2 flex justify-between items-center relative hover:bg-gray-50 transition-colors cursor-pointer"
          :href="`tel:${phone}`"
          target="_blank"
        >
          <div class="flex gap-3 items-center">
            <app-platform platform="phone" />
            <span class="text-gray-900 text-xs">
              {{ phone }}</span
            >
          </div>
          <i
            class="ri-external-link-line text-gray-300"
          ></i>
        </a>

        <div
          v-if="noIdentities"
          class="text-sm text-gray-600 px-6"
        >
          <router-link
            :to="{
              name: 'organizationEdit',
              params: { id: organization.id }
            }"
          >
            Add identities
          </router-link>
        </div>
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
import { defineProps, computed } from 'vue'

const props = defineProps({
  organization: {
    type: Object,
    default: () => {}
  }
})
const noIdentities = computed(() => {
  return (
    !props.organization.github?.url &&
    !props.organization.linkedin?.url &&
    !props.organization.twitter?.url &&
    !props.organization.crunchbase?.url &&
    (!props.organization.emails ||
      props.organization.emails.length === 0) &&
    (!props.organization.phoneNumbers ||
      props.organization.phoneNumbers.length === 0)
  )
})
</script>
