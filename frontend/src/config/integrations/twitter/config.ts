import { IntegrationConfig } from '@/config/integrations';
import TwitterConnect from './components/twitter-connect.vue';
import TwitterParams from './components/twitter-params.vue';
import TwitterDropdown from './components/twitter-dropdown.vue';

const image = new URL(
  '@/assets/images/integrations/twitter-x-black.png',
  import.meta.url,
).href;

const twitter: IntegrationConfig = {
  key: 'twitter',
  name: 'X/Twitter',
  image,
  description:
    'Connect X/Twitter to sync profile information, followers, and relevant tweets.',
  connectComponent: TwitterConnect,
  connectedParamsComponent: TwitterParams,
  dropdownComponent: TwitterDropdown,
  showProgress: false,
};

export default twitter;
