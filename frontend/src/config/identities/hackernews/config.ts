import { IdentityConfig } from '@/config/identities';

const hackernews: IdentityConfig = {
  key: 'hackernews',
  name: 'Hacker News',
  image: '/images/identities/hackernews.svg',
  member: {
    urlPrefix: 'news.ycombinator.com/user?id=',
    url: ({ identity }) => (identity.value ? `https://news.ycombinator.com/user?id=${identity.value}` : null),
  },
};

export default hackernews;
