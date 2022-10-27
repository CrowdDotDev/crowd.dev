<template>
  <app-page-wrapper>
    <h4>Integrations</h4>
    <div class="flex items-center justify-between">
      <div class="text-xs text-gray-500">
        Connect with all data sources that are relevant to
        your community
      </div>
      <div class="text-xs text-gray-900">
        <span class="text-base">🧐</span> Missing something?
        <a
          href="https://8vcqnrnp5it.typeform.com/to/EvtXce0q"
          >Contact us</a
        >
      </div>
    </div>
    <div class="mt-10">
      <div class="mb-8">
        <app-alert
          v-if="
            integrations.github &&
            integrations.github.status ===
              'waiting-approval'
          "
        >
          <template #body>
            Please invite your GitHub admin to Crowd.dev and
            ask them to set up the integration. <br />
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
            Add Discord Bot to the private channels you need
            it to have access to. <br />
            Read more about this in the following
            <a
              href="https://docs.crowd.dev/docs/discord-integration#how-to-install"
              class="font-semibold"
              >documentation</a
            >.
          </template>
        </app-alert>
      </div>
      <app-integration-list />
    </div>
  </app-page-wrapper>
</template>

<script>
import { mapGetters } from 'vuex'
import AppPageWrapper from '@/modules/layout/components/page-wrapper'
import AppIntegrationList from './integration-list'

export default {
  name: 'AppIntegrationListPage',

  components: { AppPageWrapper, AppIntegrationList },

  computed: {
    ...mapGetters({
      integrations: 'integration/listByPlatform'
    })
  }
}
</script>
