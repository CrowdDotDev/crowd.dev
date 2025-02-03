import { IdentityConfig } from '@/config/identities';

const gerrit: IdentityConfig = {
  key: 'gerrit',
  name: 'Gerrit',
  image: '/images/identities/gerrit.png',
  member: {
    placeholder: 'Gerrit username or email address',
  },
  activity: {
    showLink: true,
    showSourceId: true,
  },
  conversation: {
    replyContent: (conversation) => ({
      icon: 'reply',
      copy: 'reply',
      number: conversation.activityCount - 1,
    }),
  },
};

export default gerrit;
