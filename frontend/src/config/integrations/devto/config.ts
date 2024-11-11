import { IntegrationConfig } from '@/config/integrations';
import DevtoConnect from './components/devto-connect.vue';
import DevtoParams from './components/devto-params.vue';

const devto: IntegrationConfig = {
  key: 'devto',
  name: 'DEV',
  image: '/images/integrations/devto.png',
  description: 'Connect DEV to sync profile information and comments on articles.',
  connectComponent: DevtoConnect,
  connectedParamsComponent: DevtoParams,
};

export default devto;
