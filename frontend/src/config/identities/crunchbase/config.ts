import { IdentityConfig } from '@/config/identities';
import { getImageUrlFromPath } from '@/utils/image-loader';

const crunchbase: IdentityConfig = {
  key: 'crunchbase',
  name: 'Crunchbase',
  image: getImageUrlFromPath('identities/crunchbase.png'),
  organization: {
    urlPrefix: 'https://www.crunchbase.com/organization/',
    handle: (identity) => identity.value,
    url: (identity) => `https://www.crunchbase.com/organization/${identity.value}`,
  },
};

export default crunchbase;
