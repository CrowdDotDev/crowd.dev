import { IntegrationConfig } from '@/config/integrations';
import DiscordConnect from './components/discord-connect.vue';
import DiscordParams from './components/discord-params.vue';

const image = new URL('@/assets/images/integrations/discord.png', import.meta.url).href;

const discord: IntegrationConfig = {
  key: 'discord',
  name: 'Discord',
  image,
  description: 'Sync messages, threads, forum channels, and new joiners.',
  connectComponent: DiscordConnect,
  connectedParamsComponent: DiscordParams,
  showProgress: false,
  actionRequiredMessage: [
    {
      key: 'needs-reconnect',
      text: 'Reconnect your account to restore access.',
    },
  ],
};

export default discord;
