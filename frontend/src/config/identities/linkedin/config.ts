import { IdentityConfig } from '@/config/identities';

const linkedin: IdentityConfig = {
  key: 'linkedin',
  name: 'LinkedIn',
  image: '/images/identities/linkedin.png',
  icon: 'linkedin',
  iconType: 'brands',
  color: '#2867B2',
  member: {
    urlPrefix: 'linkedin.com/in/',
    url: ({ identity }) => (!identity.value?.includes('private-') ? `https://linkedin.com/in/${identity.value}` : null),
  },
  organization: {
    urlPrefix: 'linkedin.com/company/',
  },
  activity: {
    showLink: true,
  },
  conversation: {
    replyContent: (conversation) => ({
      icon: 'ri-reply-line',
      copy: 'reply',
      number: conversation.activityCount - 1,
    }),
  },
};

export default linkedin;
