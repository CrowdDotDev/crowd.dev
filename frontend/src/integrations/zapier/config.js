import ZapierConnect from './components/zapier-connect.vue';

export default {
  enabled: true,
  name: 'Zapier',
  backgroundColor: '#FFFFFF',
  borderColor: '#FFFFFF',
  description: 'Use Zapier to connect crowd.dev with 5,000+ apps.',
  image:
    'https://www.seekpng.com/png/full/67-672759_zapiers-new-cli-tool-for-creating-apps-zapier.png',
  connectComponent: ZapierConnect,
  url: () => null,
};
