import { IdentityConfig } from '@/config/identities';
import { getImageUrlFromPath } from '@/utils/image-loader';

const discourse: IdentityConfig = {
  key: 'discourse',
  name: 'Discourse',
  image: getImageUrlFromPath('identities/discourse.png'),
  member: {
    urlPrefix: 'https://meta.discourse.org/u/',
    url: ({ attributes }) => attributes?.url?.discourse,
  },
  activity: {
    showLink: true,
  },
};

export default discourse;
