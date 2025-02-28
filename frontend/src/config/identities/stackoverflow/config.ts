import { IdentityConfig } from '@/config/identities';
import { getImageUrlFromPath } from '@/utils/image-loader';

const stackoverflow: IdentityConfig = {
  key: 'stackoverflow',
  name: 'Stack Overflow',
  image: getImageUrlFromPath('identities/stackoverflow.png'),
  member: {
    urlPrefix: 'stackoverflow.com/users/',
    url: ({ attributes }) => attributes?.url?.stackoverflow || null,
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

export default stackoverflow;
