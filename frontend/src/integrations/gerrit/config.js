import config from '@/config';
import GerritConnect from './components/gerrit-connect.vue';

export default {
  enabled: true,
  name: 'Gerrit',
  backgroundColor: '#FFFFFF',
  borderColor: '#FFFFFF',
  description:
    'Connect Gerrit to sync documentation activities from your repos.',
  onboard: {
    description: 'Sync documentation activities from your repos.',
  },
  image:
    '/images/integrations/gerrit.png',
  connectComponent: GerritConnect,
  url: () => null,
  showProfileLink: false,
  chartColor: '#E5512C',
  activityDisplay: {
    showContentDetails: false,
    showLinkToUrl: true,
    showSourceId: true,
    typeIcon: 'gerrit',
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
