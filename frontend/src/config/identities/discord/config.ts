import { IdentityConfig } from '@/config/identities';

const discord: IdentityConfig = {
  key: 'discord',
  name: 'Discord',
  image: '/images/identities/discord.png',
  member: {
    placeholder: 'Discord username',
    url: ({ identity }) => (identity.value ? `https://discord.com/${identity.value}` : null),
  },
};

export default discord;
