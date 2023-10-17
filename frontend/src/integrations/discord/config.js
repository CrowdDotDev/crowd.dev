import DiscordConnect from './components/discord-connect.vue';

export default {
  enabled: true,
  name: 'Discord',
  backgroundColor: '#dee0fc',
  borderColor: '#dee0fc',
  description:
    'Connect Discord to sync messages, threads, forum channels, and new joiners.',
  onboard: {
    description: 'Sync messages, threads, forum channels, and new joiners.',
  },
  image:
    'https://cdn-icons-png.flaticon.com/512/5968/5968756.png',
  connectComponent: DiscordConnect,
  url: ({ username }) => (username ? `https://discord.com/${username}` : null),
  chartColor: '#6875FF',
  showProfileLink: false,
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
