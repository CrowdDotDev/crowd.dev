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
      <div class="mb-6">
        <app-alert
          v-if="
            integrations.github &&
            integrations.github.status ===
              'waiting-approval'
          "
        >
          <template #body>
            Please invite your GitHub admin to Crowd.dev and
            ask them to set up the integration.
            <a
              href="https://docs.crowd.dev/docs/github-integration#set-up-with-missing-permissions"
              class="font-semibold absolute right-0 inset-y-0 flex items-center pr-4"
              >Read more</a
            >
          </template>
        </app-alert>
        <app-alert
          v-if="
            integrations.slack &&
            integrations.slack.status === 'in-progress'
          "
        >
          <template #body>
            Add Slack Bot to channels.
            <a
              href="https://docs.crowd.dev/docs/slack-integration#how-to-install"
              class="font-semibold absolute right-0 inset-y-0 flex items-center pr-4"
              >Read more</a
            >
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
            it to have access to.
            <a
              href="https://docs.crowd.dev/docs/discord-integration#how-to-install"
              class="font-semibold absolute right-0 inset-y-0 flex items-center pr-4"
              >Read more</a
            >
          </template>
        </app-alert>
        <app-alert v-if="integrationsWithErrors.length > 0">
          <template #body>
            Please disconnect and connect again all the
            integrations with connectivity issues. If this
            problem persists, contact us via
            <a
              href="mailto:help@crowd.dev"
              class="font-semibold"
              >email</a
            >
            or engage within our
            <a
              href="https://crowd.dev/discord"
              class="font-semibold"
            >
              Discord community</a
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
      integrations: 'integration/listByPlatform',
      integrationsWithErrors: 'integration/withErrors'
    })
  }
}
</script>
