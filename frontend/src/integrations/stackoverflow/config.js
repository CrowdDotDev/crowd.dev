export default {
  enabled: true,
  name: 'Stack Overflow',
  backgroundColor: '#FFFFFF',
  borderColor: '#FFFFFF',
  description:
    'Connect Stack Overflow to sync questions and answers based on selected tags.',
  onboard: {
    description: 'Sync questions and answers based on selected tags.',
  },
  image:
    'https://cdn-icons-png.flaticon.com/512/2111/2111628.png',
  url: ({ attributes }) => attributes?.url?.stackoverflow,
  chartColor: '#FF9845',
  showProfileLink: true,
  urlPrefix: 'stackoverflow.com/users/',
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
