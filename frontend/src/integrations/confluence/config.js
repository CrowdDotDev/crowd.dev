import config from '@/config';
import ConfluenceConnect from './components/confluence-connect.vue';

export default {
  enabled: config.isConfluenceEnabled,
  hideAsIntegration: !config.isConfluenceEnabled,
  name: 'Confluence',
  backgroundColor: '#FFFFFF',
  borderColor: '#FFFFFF',
  description:
    'Connect Confluence to sync documentation activities from your repos.',
  onboard: {
    description: 'Sync documentation activities from your repos.',
  },
  image:
    '/images/integrations/conf.jpg',
  connectComponent: ConfluenceConnect,
  url: () => null,
  showProfileLink: false,
  chartColor: '#E5512C',
  activityDisplay: {
    showContentDetails: false,
    showLinkToUrl: true,
    showSourceId: true,
    typeIcon: 'confluence',
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
