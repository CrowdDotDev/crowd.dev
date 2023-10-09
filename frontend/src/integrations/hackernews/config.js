import HackerNewsConnect from './components/hackerNews-connect.vue';

export default {
  enabled: true,
  name: 'Hacker News',
  backgroundColor: '#ffdecf',
  borderColor: '#ffdecf',
  description:
    'Connect Hacker News to get posts as well as their comments mentioning your community.',
  onboard: {
    description: 'Get posts as well as their comments mentioning your community.',
  },
  image: '/images/integrations/hackernews.svg',
  connectComponent: HackerNewsConnect,
  url: ({ username }) => (username ? `https://news.ycombinator.com/user?id=${username}` : null),
  chartColor: '#FF712E',
  showProfileLink: true,
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
    handle: (identity) => (identity.url ? identity.url.split('/').at(-1) : identity.name),
  },
};
