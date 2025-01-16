import { IdentityConfig } from '@/config/identities';

const discourse: IdentityConfig = {
  key: 'discourse',
  name: 'Discourse',
  image: '/images/identities/discourse.png',
  member: {
    urlPrefix: 'https://meta.discourse.org/u/',
    url: ({ attributes }) => attributes?.url?.discourse,
  },
};

export default discourse;
