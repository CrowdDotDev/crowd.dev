import ZapierConnect from './components/zapier-connect.vue';

export default {
  enabled: true,
  name: 'Zapier',
  backgroundColor: '#FFFFFF',
  borderColor: '#FFFFFF',
  description:
    'Enable the communication between crowd.dev and Zapier to automate workflows and tasks.',
  image:
    'https://www.seekpng.com/png/full/67-672759_zapiers-new-cli-tool-for-creating-apps-zapier.png',
  connectComponent: ZapierConnect,
};
