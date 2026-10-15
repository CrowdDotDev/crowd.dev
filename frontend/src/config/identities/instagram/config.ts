import type { IdentityConfig } from '@/config/identities';

const image = new URL('@/assets/images/identities/instagram.svg', import.meta.url).href;

const instagram: IdentityConfig = {
  key: 'instagram',
  name: 'Instagram',
  image,
  member: {
    urlPrefix: 'instagram.com/',
    url: ({ identity, attributes }) =>
      attributes?.url?.instagram ||
      (identity.value ? `https://www.instagram.com/${identity.value}` : null),
  },
  activity: {
    showLink: true,
  },
};

export default instagram;
