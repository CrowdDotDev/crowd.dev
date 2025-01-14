import { IdentityConfig } from '@/config/identities';

const gerrit: IdentityConfig = {
  key: 'gerrit',
  name: 'Gerrit',
  image: '/images/identities/gerrit.png',
  member: {
    placeholder: 'Gerrit username or email address',
  },
};

export default gerrit;
