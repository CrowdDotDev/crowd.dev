import DevtoConnect from './components/devto-connect.vue';

export default {
  enabled: true,
  name: 'DEV',
  backgroundColor: '#E5E7EB',
  borderColor: '#E5E7EB',
  description:
    'Connect DEV to sync profile information and comments on articles.',
  onboard: {
    description: 'Sync profile information and comments on articles.',
  },
  image:
    'https://cdn-icons-png.flaticon.com/512/5969/5969051.png',
  connectComponent: DevtoConnect,
  url: ({ username }) => (username ? `https://dev.to/${username}` : null),
  chartColor: '#9CA3AF',
  showProfileLink: true,
  urlPrefix: 'dev.to/',
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
