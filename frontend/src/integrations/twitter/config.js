export default {
  enabled: true,
  name: 'X/Twitter',
  backgroundColor: '#d2ebfc',
  borderColor: '#d2ebfc',
  description:
    'Connect X/Twitter to sync profile information, followers, and relevant tweets.',
  image:
    '/images/integrations/twitter-x-black.png',
  url: ({ username }) => (username ? `https://twitter.com/${username}` : null),
  scale: true,
  chartColor: '#1D9BF0',
  showProfileLink: true,
  urlPrefix: 'twitter.com/',
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
    identityHandle: ({ identityHandle }) => identityHandle,
    identityLink: ({ identityHandle }) => `https://x.com/${identityHandle}`,
  },
};
