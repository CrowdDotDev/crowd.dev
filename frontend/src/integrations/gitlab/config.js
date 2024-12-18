export default {
  enabled: true,
  name: 'GitLab',
  backgroundColor: '#FCA326',
  borderColor: '#FCA326',
  description:
    'Connect GitLab to sync profile information, merge requests, issues, and more.',
  image: '/images/integrations/gitlab.png',
  url: ({ username }) => (username ? `https://gitlab.com/${username}` : null),
  chartColor: '#FC6D26',
  showProfileLink: true,
  urlPrefix: 'gitlab.com/',
  activityDisplay: {
    showLinkToUrl: true,
  },
  conversationDisplay: {
    showLabels: true,
    showConversationAttributes: true,
    replyContent: (conversation) => ({
      icon: 'ri-chat-4-line',
      copy: 'comment',
      number: conversation.activityCount - 1,
    }),
  },
};
