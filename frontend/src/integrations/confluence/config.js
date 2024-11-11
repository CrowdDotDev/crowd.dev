export default {
  enabled: true,
  name: 'Confluence',
  backgroundColor: '#FFFFFF',
  borderColor: '#FFFFFF',
  description:
    'Connect Confluence to sync documentation activities from your repos.',
  onboard: {
    description: 'Sync documentation activities from your repos.',
  },
  image:
    '/images/integrations/confluence.svg',
  url: () => null,
  showProfileLink: false,
  placeholder: 'Confluence username or email address',
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
};
