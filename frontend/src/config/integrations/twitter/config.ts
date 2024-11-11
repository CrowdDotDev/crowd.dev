import { IntegrationConfig } from '@/config/integrations';
import TwitterConnect from './components/twitter-connect.vue';
import TwitterParams from './components/twitter-params.vue';
import TwitterDropdown from './components/twitter-dropdown.vue';

const twitter: IntegrationConfig = {
  key: 'twitter',
  name: 'X/Twitter',
  image: '/images/integrations/twitter-x-black.png',
  description: 'Connect X/Twitter to sync profile information, followers, and relevant tweets.',
  connectComponent: TwitterConnect,
  connectedParamsComponent: TwitterParams,
  dropdownComponent: TwitterDropdown,
};

export default twitter;
