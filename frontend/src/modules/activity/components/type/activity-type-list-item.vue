<template>
  <article
    class="border-t first:border-none border-gray-200 flex items-center py-2.5"
  >
    <div v-if="platform" class="w-5/12 flex items-center">
      <img
        v-if="platformDetails"
        :src="platformDetails.image"
        :alt="platformDetails.name"
        class="w-4 h-4 mr-2"
      />
      <i
        v-else
        class="ri-apps-2-line text-base text-gray-400 mr-2"
      ></i>
      <p class="text-sm leading-5 py-2">
        <span v-if="platformDetails">{{
          platformDetails.name
        }}</span>
        <span v-else>{{ platform }}</span>
      </p>
    </div>
    <div
      class="flex-grow flex justify-between items-center"
    >
      <p class="text-sm leading-5">{{ label }}</p>
      <slot name="after" />
    </div>
  </article>
</template>

<script>
export default {
  name: 'AppActivityTypeListItem'
}
</script>

<script setup>
import { CrowdIntegrations } from '@/integrations/integrations-config'
import { computed, defineProps } from 'vue'

const props = defineProps({
  platform: {
    type: String,
    required: false,
    default: ''
  },
  label: {
    type: String,
    required: true
  }
})

const platformDetails = computed(() => {
  return CrowdIntegrations.getConfig(props.platform)
})
</script>
