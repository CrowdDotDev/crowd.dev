import { IdentityConfig } from '@/config/identities';

const crunchbase: IdentityConfig = {
  key: 'crunchbase',
  name: 'Crunchbase',
  image: '/src/assets/images/identities/crunchbase.png',
  organization: {
    urlPrefix: 'https://www.crunchbase.com/organization/',
    handle: (identity) => identity.value,
    url: (identity) => `https://www.crunchbase.com/organization/${identity.value}`,
  },
};

export default crunchbase;
