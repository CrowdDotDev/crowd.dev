import type { IdentityConfig } from '@/config/identities';

const image = new URL('@/assets/images/identities/producthunt.svg', import.meta.url).href;

const producthunt: IdentityConfig = {
  key: 'producthunt',
  name: 'Product Hunt',
  image,
  member: {
    urlPrefix: 'producthunt.com/@',
    url: ({ identity }) =>
      identity.value ? `https://www.producthunt.com/@${identity.value.replace(/^@/, '')}` : null,
  },
  activity: {
    showLink: true,
  },
};

export default producthunt;
