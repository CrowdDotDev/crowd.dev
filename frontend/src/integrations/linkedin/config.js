export default {
  enabled: true,
  name: 'LinkedIn',
  backgroundColor: '#D4E1F0',
  borderColor: '#D4E1F0',
  brandColor: '#2867B2',
  description:
    "Connect LinkedIn to sync comments and reactions from your organization's posts.",
  image: '/images/integrations/linkedin.png',
  icon: 'linkedin-box-fill',
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
  url: ({ username }) => (!username?.includes('private-') ? `https://linkedin.com/in/${username}` : null),
  chartColor: '#2867B2',
  showProfileLink: true,
  urlPrefix: 'linkedin.com/in/',
  orgUrlPrefix: 'linkedin.com/company/',
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
    identityHandle: ({ identityHandle }) => {
      const splittedIdentity = identityHandle?.split(':');

      if (splittedIdentity.length < 2) {
        return identityHandle;
      }

      return splittedIdentity[1];
    },
    identityLink: ({ identityHandle }) => {
      const splittedIdentity = identityHandle?.split(':');

      if (splittedIdentity.length < 2) {
        return `https://linkedin.com/company/${identityHandle}`;
      }

      const link = splittedIdentity[0] === 'school' ? 'https://linkedin.com/school/' : 'https://linkedin.com/company/';

      return `${link}/${splittedIdentity[1]}`;
    },
  },
};
