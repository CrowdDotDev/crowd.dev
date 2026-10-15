import type { IdentityConfig } from '@/config/identities';

const image = new URL('@/assets/images/identities/medium.svg', import.meta.url).href;

const medium: IdentityConfig = {
  key: 'medium',
  name: 'Medium',
  image,
  member: {
    urlPrefix: 'medium.com/@',
    url: ({ identity, attributes }) =>
      attributes?.url?.medium || (identity.value ? `https://medium.com/@${identity.value}` : null),
  },
  activity: {
    showLink: true,
  },
};

export default medium;
