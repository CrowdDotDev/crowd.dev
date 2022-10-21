<template>
  <app-activity-slack-channel
    v-if="activity.platform === 'slack'"
    :activity="activity"
  />
  <app-activity-discord-channel
    v-else-if="activity.platform === 'discord'"
    :activity="activity"
  />
  <app-activity-devto-channel
    v-else-if="activity.platform === 'devto'"
    :activity="activity"
  />
  <app-activity-github-channel
    v-else-if="activity.platform === 'github'"
    :activity="activity"
  />
</template>

<script>
import AppActivitySlackChannel from '@/modules/activity/components/integrations/slack/activity-slack-channel'
import AppActivityDiscordChannel from '@/modules/activity/components/integrations/discord/activity-discord-channel'
import AppActivityDevtoChannel from '@/modules/activity/components/integrations/devto/activity-devto-channel'
import AppActivityGithubChannel from '@/modules/activity/components/integrations/github/activity-github-channel'
export default {
  name: 'AppActivityChannel',
  components: {
    AppActivityGithubChannel,
    AppActivityDevtoChannel,
    AppActivityDiscordChannel,
    AppActivitySlackChannel
  },
  props: {
    activity: {
      type: Object,
      required: true
    }
  }
}
</script>
