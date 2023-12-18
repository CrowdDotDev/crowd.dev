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
    '/images/integrations/conf.jpg',
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
    showConversationAttributes: true,
    replyContent: () => null,
    attributes: (attributes) => ({
      changes: attributes.lines,
      changesCopy: 'line',
      insertions: attributes.insertions,
      deletions: attributes.deletions,
    }),
  },
  organization: {
    handle: (identity) => (identity.url ? identity.url.split('/').at(-1) : identity.name),
  },
};
