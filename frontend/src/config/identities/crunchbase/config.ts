import { IdentityConfig } from '@/config/identities';

const crunchbase: IdentityConfig = {
  key: 'crunchbase',
  name: 'Crunchbase',
  image: '/images/identities/crunchbase.png',
  organization: {
    urlPrefix: 'https://www.crunchbase.com/organization/',
  },
};

export default crunchbase;
