import N8nConnect from './components/n8n-connect.vue';

export default {
  enabled: true,
  name: 'n8n',
  backgroundColor: '#FFFFFF',
  borderColor: '#FFFFFF',
  description: 'Use n8n to connect LFX with 250+ apps and services.',
  image:
    'https://asset.brandfetch.io/idO6_6uqJ9/id9y5Acqtx.svg',
  connectComponent: N8nConnect,
  organization: {
    handle: (identity) => (identity.url ? identity.url.split('/').at(-1) : identity.name),
  },
};
