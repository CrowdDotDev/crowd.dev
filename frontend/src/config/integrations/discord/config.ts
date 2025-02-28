import { IntegrationConfig } from '@/config/integrations';
import { getImageUrlFromPath } from '@/utils/image-loader';
import DiscordConnect from './components/discord-connect.vue';
import DiscordParams from './components/discord-params.vue';

const discord: IntegrationConfig = {
  key: 'discord',
  name: 'Discord',
  image: getImageUrlFromPath('integrations/discord.png'),
  description:
    'Connect Discord to sync messages, threads, forum channels, and new joiners.',
  connectComponent: DiscordConnect,
  connectedParamsComponent: DiscordParams,
  showProgress: false,
};

export default discord;
