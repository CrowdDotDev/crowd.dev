import { IdentityConfig } from '@/config/identities';

const gitlab: IdentityConfig = {
  key: 'gitlab',
  name: 'GitLab',
  image: '/images/identities/gitlab.png',
  showInMembers: true,
  showInOrganizations: false,
};

export default gitlab;
