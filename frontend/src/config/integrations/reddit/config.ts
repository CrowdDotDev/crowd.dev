import { IntegrationConfig } from '@/config/integrations';
import RedditConnect from './components/reddit-connect.vue';
import RedditParams from './components/reddit-params.vue';
import RedditDropdown from './components/reddit-dropdown.vue';

const image = new URL(
  '@/assets/images/integrations/reddit.svg',
  import.meta.url,
).href;

const reddit: IntegrationConfig = {
  key: 'reddit',
  name: 'Reddit',
  image,
  description:
    'Connect Reddit to sync posts and comments from selected subreddits.',
  connectComponent: RedditConnect,
  connectedParamsComponent: RedditParams,
  dropdownComponent: RedditDropdown,
  showProgress: false,
};

export default reddit;
