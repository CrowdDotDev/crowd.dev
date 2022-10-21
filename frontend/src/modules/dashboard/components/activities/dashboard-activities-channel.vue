<template>
  <app-activities-slack-channel
    v-if="activity.platform === 'slack'"
    :activity="activity"
  />
  <app-activities-discord-channel
    v-else-if="activity.platform === 'discord'"
    :activity="activity"
  />
  <app-activities-devto-channel
    v-else-if="activity.platform === 'devto'"
    :activity="activity"
  />
  <app-activities-github-channel
    v-else-if="activity.platform === 'github'"
    :activity="activity"
  />
</template>

<script>
import AppActivitiesDevtoChannel from '@/modules/dashboard/components/activities/integrations/devto/activities-devto-channel'
import AppActivitiesGithubChannel from '@/modules/dashboard/components/activities/integrations/github/activities-github-channel'
import AppActivitiesSlackChannel from '@/modules/dashboard/components/activities/integrations/slack/activities-slack-channel'
import AppActivitiesDiscordChannel from '@/modules/dashboard/components/activities/integrations/discord/activities-discord-channel'
export default {
  name: 'AppDashboardActivitiesChannel',
  components: {
    AppActivitiesDiscordChannel,
    AppActivitiesSlackChannel,
    AppActivitiesGithubChannel,
    AppActivitiesDevtoChannel
  },
  props: {
    activity: {
      type: Object,
      required: true
    }
  }
}
</script>
