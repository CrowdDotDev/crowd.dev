<template>
  <a
    v-if="activity && activity.url"
    :href="activity.url"
    class="text-xs text-gray-600 font-medium flex items-center"
    target="_blank"
    @click.stop
    ><i class="ri-lg ri-external-link-line mr-1"></i>
    <span class="block"
      >Open on {{ platform.name }}</span
    ></a
  >
</template>

<script>
import integrationsJsonArray from '@/jsons/integrations.json'

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
      return integrationsJsonArray.find(
        (i) => i.platform === this.activity.platform
      )
    }
  }
}
</script>
