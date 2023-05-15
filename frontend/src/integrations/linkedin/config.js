import LinkedInConnect from './components/linkedin-connect.vue';

export default {
  enabled: true,
  name: 'LinkedIn',
  backgroundColor: '#D4E1F0',
  borderColor: '#D4E1F0',
  description:
    "Connect LinkedIn to sync comments and reactions from your organization's posts.",
  image: '/images/integrations/linkedin.png',
  connectComponent: LinkedInConnect,
  reactions: {
    like: 'Like',
    praise: 'Celebrate',
    maybe: 'Curious',
    empathy: 'Love',
    interest: 'Insightful',
    appreciation: 'Support',
    entertainment: 'Funny',
  },
  premium: true,
  url: (username) => (!username.includes('private-') ? `https://linkedin.com/in/${username}` : null),
  chartColor: '#2867B2',
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
