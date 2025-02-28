import { IdentityConfig } from '@/config/identities';
import { getImageUrlFromPath } from '@/utils/image-loader';

const discord: IdentityConfig = {
  key: 'discord',
  name: 'Discord',
  image: getImageUrlFromPath('identities/discord.png'),
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
