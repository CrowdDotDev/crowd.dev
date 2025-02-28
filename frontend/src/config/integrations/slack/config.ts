import { IntegrationConfig } from '@/config/integrations';
import { getImageUrlFromPath } from '@/utils/image-loader';
import SlackConnect from './components/slack-connect.vue';
import SlackParams from './components/slack-params.vue';

const slack: IntegrationConfig = {
  key: 'slack',
  name: 'Slack',
  image: getImageUrlFromPath('integrations/slack.png'),
  description: 'Connect Slack to sync messages, threads, and new joiners.',
  connectComponent: SlackConnect,
  connectedParamsComponent: SlackParams,
  showProgress: false,
};

export default slack;
