import { IdentityConfig } from '@/config/identities';
import { getImageUrlFromPath } from '@/utils/image-loader';

const devto: IdentityConfig = {
  key: 'devto',
  name: 'DEV',
  image: getImageUrlFromPath('identities/devto.png'),
  member: {
    urlPrefix: 'dev.to/',
    url: ({ identity }) => (identity.value ? `https://dev.to/${identity.value}` : null),
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

export default devto;
