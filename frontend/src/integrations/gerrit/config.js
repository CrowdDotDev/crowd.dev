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
  url: () => null,
  showProfileLink: false,
  placeholder: 'Gerrit username or email address',
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
};
