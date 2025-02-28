import { IdentityConfig } from '@/config/identities';
import { getImageUrlFromPath } from '@/utils/image-loader';

const n8n: IdentityConfig = {
  key: 'n8n',
  name: 'n8n',
  image: getImageUrlFromPath('identities/n8n.svg'),
};

export default n8n;
