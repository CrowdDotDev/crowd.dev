export default {
  enabled: true,
  name: 'Slack',
  backgroundColor: '#FFFFFF',
  borderColor: '#E5E7EB',
  description:
    'Connect Slack to sync messages, threads, and new joiners.',
  onboard: {
    description: 'Sync messages, threads, and new joiners.',
  },
  image:
    'https://cdn-icons-png.flaticon.com/512/3800/3800024.png',
  url: ({ username }) => (username ? `https://slack.com/${username}` : null),
  chartColor: '#E41756',
  showProfileLink: false,
  placeholder: 'Slack username or email address',
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
