import config from '@/config';
import N8nConnect from './components/n8n-connect.vue';

export default {
  enabled: config.isN8nIntegrationEnabled,
  hideAsIntegration: !config.isN8nIntegrationEnabled,
  name: 'n8n',
  backgroundColor: '#FFFFFF',
  borderColor: '#FFFFFF',
  description: 'Use n8n to connect crowd.dev with 250+ apps and services.',
  onboard: {
    description: 'Connect crowd.dev with 250+ apps and services.',
  },
  image:
    'https://asset.brandfetch.io/idO6_6uqJ9/id9y5Acqtx.svg',
  connectComponent: N8nConnect,
  organization: {
    handle: (identity) => (identity.url ? identity.url.split('/').at(-1) : identity.name),
  },
};
