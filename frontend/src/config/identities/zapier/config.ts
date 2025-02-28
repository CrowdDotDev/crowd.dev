import { IdentityConfig } from '@/config/identities';
import { getImageUrlFromPath } from '@/utils/image-loader';

const zapier: IdentityConfig = {
  key: 'zapier',
  name: 'Zapier',
  image: getImageUrlFromPath('identities/zapier.png'),
};

export default zapier;
