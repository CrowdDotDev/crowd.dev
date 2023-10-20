import config from '@/config';
import TwitterConnect2 from './components/twitter-connect-2.vue';
import TwitterConnect from './components/twitter-connect.vue';

export default {
  enabled: true,
  name: 'Twitter',
  backgroundColor: '#d2ebfc',
  borderColor: '#d2ebfc',
  description:
    'Connect Twitter to sync profile information, followers, and relevant tweets.',
  image:
    'https://img.freepik.com/premium-vector/new-twitter-logo-x-2023-twitter-x-logo-vector_715895-569.jpg',
  connectComponent: config.isTwitterIntegrationEnabled ? TwitterConnect2 : TwitterConnect,
  url: ({ username }) => (username ? `https://twitter.com/${username}` : null),
  chartColor: '#1D9BF0',
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
  organization: {
    handle: (identity) => (identity.url ? identity.url.split('/').at(-1) : identity.name),
  },
};
