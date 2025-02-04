import { IdentityConfig } from '@/config/identities';

const stackoverflow: IdentityConfig = {
  key: 'stackoverflow',
  name: 'Stack Overflow',
  image: '/images/identities/stackoverflow.png',
  member: {
    urlPrefix: 'stackoverflow.com/users/',
    url: ({ attributes }) => attributes?.url?.stackoverflow || null,
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

export default stackoverflow;
