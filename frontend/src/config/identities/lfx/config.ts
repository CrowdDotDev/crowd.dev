import { IdentityConfig } from '@/config/identities';

const image = new URL('@/assets/images/identities/lfx.png', import.meta.url)
  .href;

const lfx: IdentityConfig = {
  key: 'lfx',
  name: 'Linux Foundation ID',
  image,
  member: {
    placeholder: 'Linux Foundation ID',
  },
};

export default lfx;
