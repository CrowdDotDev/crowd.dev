import ZapierConnect from './components/zapier-connect.vue';

export default {
  enabled: true,
  name: 'Zapier',
  backgroundColor: '#FFFFFF',
  borderColor: '#FFFFFF',
  description: 'Use Zapier to connect LFX with 5,000+ apps.',
  image:
    'https://www.seekpng.com/png/full/67-672759_zapiers-new-cli-tool-for-creating-apps-zapier.png',
  connectComponent: ZapierConnect,
  url: () => null,
  chartColor: '#FF9676',
  showProfileLink: true,
  activityDisplay: {
    showLinkToUrl: true,
  },
  conversationDisplay: {
    replyContent: (conversation) => ({
      icon: 'ri-reply-line',
      copy: 'reply',
      number: conversation.activityCount - 1,
    }),
  },
};
