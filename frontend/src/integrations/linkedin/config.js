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
};
