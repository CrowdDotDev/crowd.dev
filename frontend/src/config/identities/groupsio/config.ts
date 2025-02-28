import { IdentityConfig } from '@/config/identities';
import { getImageUrlFromPath } from '@/utils/image-loader';

const groupsio: IdentityConfig = {
  key: 'groupsio',
  name: 'Groups.io',
  image: getImageUrlFromPath('identities/groupsio.svg'),
  member: {
    placeholder: 'Groups.io email address',
  },
  activity: {
    showLink: true,
  },
};

export default groupsio;
