import { IntegrationConfig } from '@/config/integrations';
import { getImageUrlFromPath } from '@/utils/image-loader';
import LinkedinConnect from './components/linkedin-connect.vue';
import LinkedinParams from './components/linkedin-params.vue';
import LinkedinAction from './components/linkedin-action.vue';
import LinkedinDropdown from './components/linkedin-dropdown.vue';

const linkedin: IntegrationConfig = {
  key: 'linkedin',
  name: 'LinkedIn',
  image: getImageUrlFromPath('integrations/linkedin.png'),
  description:
    "Connect LinkedIn to sync comments and reactions from your organization's posts.",
  connectComponent: LinkedinConnect,
  connectedParamsComponent: LinkedinParams,
  actionComponent: LinkedinAction,
  dropdownComponent: LinkedinDropdown,
  showProgress: false,
};

export default linkedin;
