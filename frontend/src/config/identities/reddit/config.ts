import { IdentityConfig } from '@/config/identities';

const reddit: IdentityConfig = {
  key: 'reddit',
  name: 'Reddit',
  image: '/images/identities/reddit.svg',
  member: {
    urlPrefix: 'reddit.com/user/',
    url: ({ identity }) => (identity.value ? `https://reddit.com/user/${identity.value}` : null),
  }
};

export default reddit;
