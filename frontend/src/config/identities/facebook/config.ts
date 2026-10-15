import type { IdentityConfig } from '@/config/identities';

const image = new URL('@/assets/images/identities/facebook.png', import.meta.url).href;

const facebook: IdentityConfig = {
  key: 'facebook',
  name: 'Facebook',
  image,
  member: {
    urlPrefix: 'facebook.com/',
    url: ({ identity, attributes }) =>
      attributes?.url?.facebook ||
      (identity.value ? `https://www.facebook.com/${identity.value}` : null),
  },
  activity: {
    showLink: true,
  },
};

export default facebook;
