<template>
  <app-page-wrapper>
    <h4>Integrations</h4>
    <div class="flex items-center justify-between">
      <div class="text-xs text-gray-500">
        Connect with all data sources where interactions happen with your brand and product.
        <br>When we detect an activity, we sync it to your workspace.
      </div>
      <div class="text-xs text-gray-900">
        <span class="text-base">🧐</span> Missing something?
        <a
          href="https://github.com/CrowdDotDev/crowd.dev/issues?q=is%3Aopen+is%3Aissue+label%3A%22Integration+%F0%9F%94%8C%22+"
        >Open an issue</a>
      </div>
    </div>
    <div class="mt-10">
      <div class="mb-6">
        <app-alert
          v-if="
            integrations.github
              && integrations.github.status
                === 'waiting-approval'
          "
        >
          <template #body>
            Please invite your GitHub admin to Crowd.dev and
            ask them to set up the integration.
            <a
              href="https://docs.crowd.dev/docs/github-integration#set-up-with-missing-permissions"
              class="font-semibold absolute right-0 inset-y-0 flex items-center pr-4"
              rel="noopener noreferrer"
              target="_blank"
            >Read more</a>
          </template>
        </app-alert>
        <app-alert
          v-if="
            integrations.discord
              && integrations.discord.status === 'in-progress'
          "
        >
          <template #body>
            Add Discord Bot to the private channels you need
            it to have access to.
            <a
              href="https://docs.crowd.dev/docs/discord-integration#how-to-install"
              class="font-semibold absolute right-0 inset-y-0 flex items-center pr-4"
              rel="noopener noreferrer"
              target="_blank"
            >Read more</a>
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
            >email</a>
            or engage within our
            <a
              href="https://crowd.dev/discord"
              class="font-semibold"
            >
              Discord community</a>.
          </template>
        </app-alert>
        <app-alert v-if="integrationsWithNoData.length > 0">
          <template #body>
            Please check the
            <a
              href="https://docs.crowd.dev/integrations"
              class="font-semibold"
              target="_blank"
              rel="noopener noreferrer"
            >documentation</a>
            for integrations with no activities to make sure
            they are set up correctly. If the setup is
            correct, contact us via
            <a
              href="mailto:help@crowd.dev"
              class="font-semibold"
            >email</a>
            or engage within our
            <a
              href="https://crowd.dev/discord"
              class="font-semibold"
            >
              Discord community</a>.
          </template>
        </app-alert>
      </div>
      <app-integration-list />
    </div>
  </app-page-wrapper>
</template>

<script>
import { mapGetters } from 'vuex';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import Message from '@/shared/message/message';
import AppIntegrationList from './integration-list.vue';

export default {
  name: 'AppIntegrationListPage',

  components: { AppIntegrationList },

  computed: {
    ...mapGetters({
      integrations: 'integration/listByPlatform',
      integrationsWithErrors: 'integration/withErrors',
      integrationsWithNoData: 'integration/withNoData',
    }),
  },

  watch: {
    '$route.query.slack-success': {
      immediate: true,
      handler(value) {
        if (value) {
          ConfirmDialog({
            vertical: true,
            type: 'custom',
            icon: '<img src="https://cdn-icons-png.flaticon.com/512/3800/3800024.png" class="h-8 w-8" alt="slack logo" />',
            title: `<span class="flex items-start gap-1">Connect Slack bot
              <span class="text-brand-500 text-3xs leading-3 pt-1 font-normal">Required</span></span>`,
            titleClass: 'text-lg',
            message: `
            <img src="/images/integrations/slack-bot.png" class="mb-6" alt="slack bot installation" />
            To fetch data from Slack, you need to install the crowd.dev Slack bot and add it to all channels you want to track. <br><br>
            You can either add the Slack bot directly from a channel, or add the app via channel Integrations.`,
            confirmButtonText: 'How to connect Slack bot',
            showCancelButton: false,
            messageClass: 'text-xs !leading-5 !mt-1 text-gray-600',
            verticalCustomClass: 'custom-slack-message-box',
            closeOnClickModal: false,
            hideCloseButton: true,
          }).then(() => {
            window.open('https://docs.crowd.dev/docs/slack-integration#how-to-install', '_blank');
            this.$router.replace({ query: null });
          });
        }
      },
    },
    '$route.query.twitter-error': {
      immediate: true,
      handler(value) {
        if (value) {
          Message.error('Something went wrong during X/Twitter OAuth. Please try again later.');
        }
      },
    },
  },
};
</script>

<style>
.custom-slack-message-box .el-button--primary span::after {
  content: "\ecaf";
  font-family: "remixicon" !important;
  font-size: 18px;
  margin-left: 0.5rem;
}
</style>
