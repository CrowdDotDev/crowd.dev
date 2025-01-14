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
};

export default twitter;
