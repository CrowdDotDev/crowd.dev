import { IntegrationConfig } from '@/config/integrations';
import DiscourseConnect from './components/discourse-connect.vue';
import DiscourseParams from './components/discourse-params.vue';
import DiscourseDropdown from './components/discourse-dropdown.vue';

const discourse: IntegrationConfig = {
  key: 'discourse',
  name: 'Discourse',
  image: '/images/integrations/discourse.png',
  description: 'Connect Discourse to sync topics, posts, and replies from your account forums.',
  connectComponent: DiscourseConnect,
  connectedParamsComponent: DiscourseParams,
  dropdownComponent: DiscourseDropdown,
  showProgress: false,
};

export default discourse;
