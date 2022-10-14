<template>
  <div class="member-view-aside panel">
    <div>
      <div class="flex items-center justify-between">
        <div class="font-medium text-black">Identities</div>
        <el-button
          class="btn btn-link btn-link--primary"
          @click="identitiesDrawer = true"
          >Manage Identities</el-button
        >
      </div>
      <div class="-mx-6 mt-6">
        <a
          v-for="platform of Object.keys(member.username)"
          :key="platform"
          class="px-6 py-2 flex items-center relative"
          :class="
            member.attributes.url &&
            member.attributes.url[platform] !== undefined
              ? 'hover:bg-gray-50 transition-colors cursor-pointer'
              : ''
          "
          :href="
            member.attributes.url &&
            member.attributes.url[platform]
          "
          target="_blank"
        >
          <span
            class="btn cursor-auto p-2 bg-gray-100 border border-gray-200 mr-3"
            :class="`btn--${platform}`"
          >
            <img
              :src="findIcon(platform)"
              :alt="`${platform}-icon`"
              class="w-4 h-4"
            />
          </span>
          <span class="text-gray-900 text-xs">
            {{ member.username[platform] }}</span
          >
          <i
            v-if="
              member.attributes.url &&
              member.attributes.url[platform]
            "
            class="ri-external-link-line absolute right-0 inset-y mr-4 text-gray-400"
          ></i>
        </a>
      </div>
    </div>
    <div
      v-if="computedCustomAttributes.length > 0"
      class="mt-10"
    >
      <div class="font-medium text-black mb-6">
        Custom attributes
      </div>
      <div
        v-for="(
          attribute, index
        ) of computedCustomAttributes"
        :key="attribute.id"
        class="py-3"
        :class="
          index < computedCustomAttributes.length - 1
            ? 'border-b border-gray-200'
            : ''
        "
      >
        <p class="text-gray-400 font-medium text-2xs">
          {{ attribute.label }}
        </p>
        <p class="mt-1 text-gray-900 text-xs">
          {{ member.attributes[attribute.name].default }}
        </p>
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
import { useStore } from 'vuex'
import { computed, defineProps } from 'vue'
import integrationsJsonArray from '@/jsons/integrations.json'

const store = useStore()

defineProps({
  member: {
    type: Object,
    default: () => {}
  }
})

const computedCustomAttributes = computed(() => {
  return Object.values(
    store.state.member.customAttributes
  ).filter((attribute) => {
    return attribute.show && attribute.canDelete
  })
})

const findIcon = (platform) => {
  return integrationsJsonArray.find(
    (p) => p.platform === platform
  ).image
}
</script>
