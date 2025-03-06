import { IdentityConfig } from '@/config/identities';

const image = new URL('@/assets/images/identities/gerrit.png', import.meta.url)
  .href;

const gerrit: IdentityConfig = {
  key: 'gerrit',
  name: 'Gerrit',
  image,
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
