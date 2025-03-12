import { IntegrationConfig } from '@/config/integrations';
import DevtoConnect from './components/devto-connect.vue';
import DevtoParams from './components/devto-params.vue';

const image = new URL('@/assets/images/integrations/devto.png', import.meta.url)
  .href;

const devto: IntegrationConfig = {
  key: 'devto',
  name: 'DEV',
  image,
  description:
    'Connect DEV to sync profile information and comments on articles.',
  connectComponent: DevtoConnect,
  connectedParamsComponent: DevtoParams,
  showProgress: false,
};

export default devto;
