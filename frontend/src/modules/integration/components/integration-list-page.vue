<template>
  <div>
    <app-alert
      v-if="
        integrations.github &&
        integrations.github.status === 'waiting-approval'
      "
    >
      <template #body>
        Please invite your GitHub admin to Crowd.dev and ask
        them to set up the integration. <br />
        Read more about this in the following
        <a
          href="https://docs.crowd.dev/docs/github-integration#set-up-with-missing-permissions"
          class="font-semibold"
          >documentation</a
        >.
      </template>
    </app-alert>
    <app-alert
      v-if="
        integrations.slack &&
        integrations.slack.status === 'in-progress'
      "
    >
      <template #body>
        Add Slack Bot to channels. <br />
        Read more about this in the following
        <a
          href="https://docs.crowd.dev/docs/slack-integration#how-to-install"
          class="font-semibold"
          >documentation</a
        >.
      </template>
    </app-alert>
    <app-alert
      v-if="
        integrations.discord &&
        integrations.discord.status === 'in-progress'
      "
    >
      <template #body>
        Add Discord Bot to the private channels you need it
        to have access to. <br />
        Read more about this in the following
        <a
          href="https://docs.crowd.dev/docs/discord-integration#how-to-install"
          class="font-semibold"
          >documentation</a
        >.
      </template>
    </app-alert>
    <app-integration-list />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import AppIntegrationList from './integration-list'

export default {
  name: 'AppIntegrationListPage',

  components: { AppIntegrationList },

  computed: {
    ...mapGetters({
      integrations: 'integration/listByPlatform'
    })
  }
}
</script>
