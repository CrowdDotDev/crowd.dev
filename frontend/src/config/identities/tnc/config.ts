import { IdentityConfig } from '@/config/identities';
import { getImageUrlFromPath } from '@/utils/image-loader';

const tnc: IdentityConfig = {
  key: 'tnc',
  name: 'Training & Certification',
  image: getImageUrlFromPath('identities/tnc.png'),
  member: {
    placeholder: 'Linux Foundation ID',
  },
};

export default tnc;
