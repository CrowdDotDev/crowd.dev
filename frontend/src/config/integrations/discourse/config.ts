import { IntegrationConfig } from '@/config/integrations';
import DiscourseConnect from './components/discourse-connect.vue';
import DiscourseParams from './components/discourse-params.vue';
import DiscourseDropdown from './components/discourse-dropdown.vue';

const image = new URL(
  '@/assets/images/integrations/discourse.png',
  import.meta.url,
).href;

const discourse: IntegrationConfig = {
  key: 'discourse',
  name: 'Discourse',
  image,
  description:
    'Connect Discourse to sync topics, posts, and replies from your account forums.',
  connectComponent: DiscourseConnect,
  connectedParamsComponent: DiscourseParams,
  dropdownComponent: DiscourseDropdown,
  showProgress: false,
};

export default discourse;
