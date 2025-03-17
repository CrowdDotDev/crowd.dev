import { IdentityConfig } from '@/config/identities';

const image = new URL('@/assets/images/identities/reddit.svg', import.meta.url)
  .href;

const reddit: IdentityConfig = {
  key: 'reddit',
  name: 'Reddit',
  image,
  member: {
    urlPrefix: 'reddit.com/user/',
    url: ({ identity }) => (identity.value ? `https://reddit.com/user/${identity.value}` : null),
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

export default reddit;
