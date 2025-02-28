import { IdentityConfig } from '@/config/identities';
import { getImageUrlFromPath } from '@/utils/image-loader';

const facebook: IdentityConfig = {
  key: 'facebook',
  name: 'Facebook',
  image: getImageUrlFromPath('identities/facebook.png'),
};

export default facebook;
