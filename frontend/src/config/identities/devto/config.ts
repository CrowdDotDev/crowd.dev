import { IdentityConfig } from '@/config/identities';

const devto: IdentityConfig = {
  key: 'devto',
  name: 'DEV',
  image: '/images/identities/devto.png',
  member: {
    urlPrefix: 'dev.to/',
    url: ({ identity }) => (identity.value ? `https://dev.to/${identity.value}` : null),
  },
};

export default devto;
