<template>
  <!-- discord, slack -->
  <app-activities-slack-message
    v-if="activity.platform === 'slack'"
    :activity="activity"
    :short="short"
  />
  <app-activities-discord-message
    v-else-if="activity.platform === 'discord'"
    :activity="activity"
    :short="short"
  />
  <app-activities-devto-message
    v-else-if="activity.platform === 'devto'"
    :activity="activity"
    :short="short"
  />
  <app-activities-github-message
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
import AppActivitiesSlackMessage from '@/modules/dashboard/components/activities/integrations/slack/activities-slack-message'
import AppActivitiesDiscordMessage from '@/modules/dashboard/components/activities/integrations/discord/activities-discord-message'
import AppActivitiesDevtoMessage from '@/modules/dashboard/components/activities/integrations/devto/activities-devto-message'
import AppActivitiesGithubMessage from '@/modules/dashboard/components/activities/integrations/github/activities-github-message'
export default {
  name: 'AppDashboardActivitiesMessage',
  components: {
    AppActivitiesGithubMessage,
    AppActivitiesDevtoMessage,
    AppActivitiesDiscordMessage,
    AppActivitiesSlackMessage,
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
