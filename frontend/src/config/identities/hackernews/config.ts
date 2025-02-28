import { IdentityConfig } from '@/config/identities';
import { getImageUrlFromPath } from '@/utils/image-loader';

const hackernews: IdentityConfig = {
  key: 'hackernews',
  name: 'Hacker News',
  image: getImageUrlFromPath('identities/hackernews.svg'),
  member: {
    urlPrefix: 'news.ycombinator.com/user?id=',
    url: ({ identity }) => (identity.value
      ? `https://news.ycombinator.com/user?id=${identity.value}`
      : null),
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

export default hackernews;
