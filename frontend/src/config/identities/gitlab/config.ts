import { IdentityConfig } from '@/config/identities';

const gitlab: IdentityConfig = {
  key: 'gitlab',
  name: 'GitLab',
  image: '/images/identities/gitlab.png',
  member: {
    urlPrefix: 'gitlab.com/',
    url: ({ identity }) => (identity.value ? `https://gitlab.com/${identity.value}` : null),
  }
};

export default gitlab;
