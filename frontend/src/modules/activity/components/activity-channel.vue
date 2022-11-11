<template>
  <component
    :is="platformConfig.activityChannel"
    v-if="platformConfig.activityChannel"
    :activity="activity"
  ></component>
</template>

<script>
import { CrowdIntegrations } from '@/integrations/integrations-config'
export default {
  name: 'AppActivityChannel',
  props: {
    activity: {
      type: Object,
      required: true
    }
  },
  computed: {
    platformConfig() {
      return CrowdIntegrations.getConfig(
        this.activity.platform
      )
    }
  }
}
</script>
