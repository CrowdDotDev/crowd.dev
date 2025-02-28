import { IdentityConfig } from '@/config/identities';
import { getImageUrlFromPath } from '@/utils/image-loader';

const reddit: IdentityConfig = {
  key: 'reddit',
  name: 'Reddit',
  image: getImageUrlFromPath('identities/reddit.svg'),
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
