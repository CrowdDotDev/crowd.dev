import { IdentityConfig } from '@/config/identities';

const github: IdentityConfig = {
  key: 'github',
  name: 'GitHub',
  image: '/images/identities/github.png',
  icon: 'github-fill',
  color: '#24292F',
  member: {
    urlPrefix: 'github.com/',
    url: ({ identity }) => (identity.value ? `https://github.com/${identity.value}` : null),
  },
  organization: {
    urlPrefix: 'github.com/',
  },
};

export default github;
