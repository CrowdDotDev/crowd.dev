<template>
  <div class="flex">
    <component
      :is="platformConfig.activityMessage"
      v-if="platformConfig.activityMessage"
      :activity="activity"
      :channel-only="channelOnly"
      :short="short"
    ></component>
    <!-- other -->
    <template v-else>
      <app-i18n
        v-if="!channelOnly"
        :code="computedMessage"
        :args="computedArgs"
        :fallback="'entities.activity.fallback'"
        :class="{ truncate: short }"
      ></app-i18n>
    </template>
  </div>
</template>

<script>
import AppI18n from '@/shared/i18n/i18n'
import { computedArgs } from '@/modules/activity/activity.helpers'
import { CrowdIntegrations } from '@/integrations/integrations-config'
export default {
  name: 'AppActivityMessage',
  components: {
    AppI18n
  },
  props: {
    activity: {
      type: Object,
      required: true
    },
    short: {
      type: Boolean,
      required: false,
      default: false
    },
    channelOnly: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  computed: {
    platformConfig() {
      return CrowdIntegrations.getConfig(
        this.activity.platform
      )
    },
    computedMessage() {
      return `entities.activity.${this.activity.platform}.${this.activity.type}`
    },
    computedArgs() {
      return computedArgs(this.activity)
    }
  },
  methods: {
    getRepositoryName(repositoryUrl) {
      const splittedUrl = repositoryUrl.split('/')
      if (splittedUrl.length > 0) {
        return splittedUrl[splittedUrl.length - 1]
      }
      return ''
    }
  }
}
</script>
