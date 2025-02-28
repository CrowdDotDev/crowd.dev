import { IdentityConfig } from '@/config/identities';
import { getImageUrlFromPath } from '@/utils/image-loader';

const lfx: IdentityConfig = {
  key: 'lfx',
  name: 'Linux Foundation ID',
  image: getImageUrlFromPath('identities/lfx.png'),
  member: {
    placeholder: 'Linux Foundation ID',
  },
};

export default lfx;
