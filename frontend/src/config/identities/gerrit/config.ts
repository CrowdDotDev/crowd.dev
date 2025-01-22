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
      icon: 'ri-reply-line',
      copy: 'reply',
      number: conversation.activityCount - 1,
    }),
  },
};

export default gerrit;
