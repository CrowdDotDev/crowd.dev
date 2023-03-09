<template>
  <article
    class="border-t first:border-none border-gray-200 flex items-center py-4.5"
  >
    <div class="w-5/12 flex items-center">
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
      <p class="text-sm leading-5">
        <span v-if="platformDetails">{{
          platformDetails.name
        }}</span>
        <span v-else>{{ platform }}</span>
      </p>
    </div>
    <div class="w-7/12 flex justify-between items-center">
      <p class="text-sm leading-5">Comment on an issue</p>
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
    required: true
  }
})

const platformDetails = computed(() => {
  return CrowdIntegrations.getConfig(props.platform)
})
</script>
