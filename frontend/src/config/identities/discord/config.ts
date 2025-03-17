import { IdentityConfig } from '@/config/identities';

const image = new URL('@/assets/images/identities/discord.png', import.meta.url)
  .href;

const discord: IdentityConfig = {
  key: 'discord',
  name: 'Discord',
  image,
  member: {
    placeholder: 'Discord username',
    url: ({ identity }) => (identity.value ? `https://discord.com/${identity.value}` : null),
  },
  activity: {
    showLink: true,
  },
  conversation: {
    replyContent: (conversation) => ({
      icon: 'reply',
      copy: 'reply',
      number: conversation.activityCount - 1,
    }),
  },
};

export default discord;
