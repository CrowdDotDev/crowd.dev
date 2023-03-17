<template>
  <a
    v-if="activity && activity.url"
    :href="activity.url"
    class="text-xs text-gray-600 font-medium flex items-center"
    target="_blank"
    @click.stop
    ><i class="ri-lg ri-external-link-line mr-1"></i>
    <span v-if="platform" class="block"
      >Open on {{ platform.name }}</span
    >
    <span v-else class="block">Open link</span></a
  >
</template>

<script>
import { CrowdIntegrations } from '@/integrations/integrations-config'

export default {
  name: 'AppActivityLink',
  props: {
    activity: {
      type: Object,
      required: false,
      default: () => ({})
    }
  },
  computed: {
    platform() {
      return CrowdIntegrations.getConfig(
        this.activity.platform
      )
    }
  }
}
</script>
