import { IdentityConfig } from '@/config/identities';
import { getImageUrlFromPath } from '@/utils/image-loader';

const cvent: IdentityConfig = {
  key: 'cvent',
  name: 'Cvent',
  image: getImageUrlFromPath('identities/cvent.png'),
  member: {
    placeholder: 'Cvent username or email address',
  },
};

export default cvent;
