<template>
  <!-- discord, slack -->
  <app-activity-slack-message
    v-if="activity.platform === 'slack'"
    :activity="activity"
    :short="short"
  />
  <app-activity-discord-message
    v-else-if="activity.platform === 'discord'"
    :activity="activity"
    :short="short"
  />
  <app-activity-devto-message
    v-else-if="activity.platform === 'devto'"
    :activity="activity"
    :short="short"
  />
  <app-activity-github-message
    v-else-if="activity.platform === 'github'"
    :activity="activity"
    :short="short"
  />
  <!-- other -->
  <template v-else>
    <app-i18n
      :code="computedMessage"
      :args="computedArgs"
      :fallback="'entities.activity.fallback'"
    ></app-i18n>
  </template>
</template>

<script>
import AppI18n from '@/shared/i18n/i18n'
import { computedArgs } from '@/modules/activity/activity.helpers'
import AppActivitySlackMessage from '@/modules/activity/components/integrations/slack/activity-slack-message'
import AppActivityDiscordMessage from '@/modules/activity/components/integrations/discord/activity-discord-message'
import AppActivityDevtoMessage from '@/modules/activity/components/integrations/devto/activity-devto-message'
import AppActivityGithubMessage from '@/modules/activity/components/integrations/github/activity-github-message'
export default {
  name: 'AppActivityMessage',
  components: {
    AppActivityGithubMessage,
    AppActivityDevtoMessage,
    AppActivityDiscordMessage,
    AppActivitySlackMessage,
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
    }
  },
  computed: {
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
