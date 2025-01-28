import { IdentityConfig } from '@/config/identities';

const discord: IdentityConfig = {
  key: 'discord',
  name: 'Discord',
  image: '/images/identities/discord.png',
  member: {
    placeholder: 'Discord username',
    url: ({ identity }) => (identity.value ? `https://discord.com/${identity.value}` : null),
  },
  activity: {
    showLink: true,
  },
  conversation: {
    replyContent: (conversation) => ({
      icon: 'ri-reply-line',
      copy: 'reply',
      number: conversation.activityCount - 1,
    }),
  },
};

export default discord;
