import { IdentityConfig } from '@/config/identities';

const groupsio: IdentityConfig = {
  key: 'groupsio',
  name: 'Groups.io',
  image: '/images/identities/groupsio.svg',
  member: {
    placeholder: 'Groups.io email address',
  },
  activity: {
    showLink: true,
  },
};

export default groupsio;
