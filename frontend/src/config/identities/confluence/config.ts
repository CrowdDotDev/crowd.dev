import { IdentityConfig } from '@/config/identities';

const confluence: IdentityConfig = {
  key: 'confluence',
  name: 'Confluence',
  image: '/images/identities/confluence.svg',
  member: {
    placeholder: 'Confluence username or email address',
  },
};

export default confluence;
