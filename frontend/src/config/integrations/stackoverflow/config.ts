import { IntegrationConfig } from '@/config/integrations';
import { getImageUrlFromPath } from '@/utils/image-loader';
import StackoverflowConnect from './components/stackoverflow-connect.vue';
import StackoverflowDropdown from './components/stackoverflow-dropdown.vue';
import StackoverflowParams from './components/stackoverflow-params.vue';

const stackoverflow: IntegrationConfig = {
  key: 'stackoverflow',
  name: 'Stack Overflow',
  image: getImageUrlFromPath('integrations/stackoverflow.png'),
  description:
    'Connect Stack Overflow to sync questions and answers based on selected tags.',
  connectComponent: StackoverflowConnect,
  dropdownComponent: StackoverflowDropdown,
  connectedParamsComponent: StackoverflowParams,
  showProgress: false,
};

export default stackoverflow;
