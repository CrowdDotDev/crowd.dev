import { IdentityConfig } from '@/config/identities';
import { getImageUrlFromPath } from '@/utils/image-loader';

const gitlab: IdentityConfig = {
  key: 'gitlab',
  name: 'GitLab',
  image: getImageUrlFromPath('identities/gitlab.png'),
  member: {
    urlPrefix: 'gitlab.com/',
    url: ({ identity }) => (identity.value ? `https://gitlab.com/${identity.value}` : null),
  },
  activity: {
    showLink: true,
  },
  conversation: {
    showLabels: true,
    replyContent: (conversation) => ({
      icon: 'message',
      copy: 'comment',
      number: conversation.activityCount - 1,
    }),
  },
};

export default gitlab;
