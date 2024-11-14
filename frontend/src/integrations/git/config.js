import config from '@/config';

export default {
  enabled: config.isGitIntegrationEnabled,
  hideAsIntegration: !config.isGitIntegrationEnabled,
  name: 'Git',
  backgroundColor: '#FFFFFF',
  borderColor: '#FFFFFF',
  description:
    'Connect Git to sync commit activities from your repos.',
  onboard: {
    description: 'Sync commit activities from your repos.',
  },
  image:
    '/images/integrations/git.png',
  url: () => null,
  showProfileLink: false,
  placeholder: 'Git email address',
  chartColor: '#E5512C',
  activityDisplay: {
    showContentDetails: true,
    showLinkToUrl: false,
    showSourceId: true,
    typeIcon: 'commit',
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
};
