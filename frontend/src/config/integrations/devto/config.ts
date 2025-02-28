import { IntegrationConfig } from '@/config/integrations';
import { getImageUrlFromPath } from '@/utils/image-loader';
import DevtoConnect from './components/devto-connect.vue';
import DevtoParams from './components/devto-params.vue';

const devto: IntegrationConfig = {
  key: 'devto',
  name: 'DEV',
  image: getImageUrlFromPath('integrations/devto.png'),
  description:
    'Connect DEV to sync profile information and comments on articles.',
  connectComponent: DevtoConnect,
  connectedParamsComponent: DevtoParams,
  showProgress: false,
};

export default devto;
