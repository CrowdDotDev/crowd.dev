import StackOverflowConnect from './components/youtube-connect.vue';

export default {
  enabled: true,
  name: 'Youtube',
  backgroundColor: '#FFFFFF',
  borderColor: '#FFFFFF',
  description:
    'Connect Youtube to sync comments based on channels or selected keywords.',
  image:
    'https://cdn-icons-png.flaticon.com/512/174/174883.png',
  connectComponent: StackOverflowConnect,
  url: (username) => `https://www.youtube.com/channel/${username}`,
  chartColor: '#FF9845',
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
};
