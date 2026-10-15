import type { IdentityConfig } from '@/config/identities';

const image = new URL('@/assets/images/identities/tiktok.svg', import.meta.url).href;

const tiktok: IdentityConfig = {
  key: 'tiktok',
  name: 'TikTok',
  image,
  member: {
    urlPrefix: 'tiktok.com/@',
    url: ({ identity, attributes }) =>
      attributes?.url?.tiktok ||
      (identity.value ? `https://www.tiktok.com/@${identity.value}` : null),
  },
  activity: {
    showLink: true,
  },
};

export default tiktok;
