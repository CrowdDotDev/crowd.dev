import { IntegrationConfig } from '@/config/integrations';
import GitConnect from './components/git-connect.vue';
import GitDropdown from './components/git-dropdown.vue';
import GitParams from './components/git-params.vue';

const git: IntegrationConfig = {
  key: 'git',
  name: 'Git',
  image: '/images/integrations/git.png',
  description: 'Connect Git to sync commit activities from your repos.',
  connectComponent: GitConnect,
  dropdownComponent: GitDropdown,
  connectedParamsComponent: GitParams,
  showProgress: false,
};

export default git;
