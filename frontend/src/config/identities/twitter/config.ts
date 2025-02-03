import { IdentityConfig } from '@/config/identities';

const twitter: IdentityConfig = {
  key: 'twitter',
  name: 'X/Twitter',
  image: '/images/identities/twitter.png',
  member: {
    urlPrefix: 'twitter.com/',
    url: ({ identity }) => (identity.value ? `https://twitter.com/${identity.value}` : null),
  },
  organization: {
    urlPrefix: 'twitter.com/',
  },
  activity: {
    showLink: true,
  },
  conversation: {
    replyContent: (conversation) => ({
      icon: 'reply',
      copy: 'reply',
      number: conversation.activityCount - 1,
    }),
  },
};

export default twitter;
