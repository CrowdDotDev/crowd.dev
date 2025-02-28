import { IdentityConfig } from '@/config/identities';
import { getImageUrlFromPath } from '@/utils/image-loader';

const jira: IdentityConfig = {
  key: 'jira',
  name: 'Jira',
  image: getImageUrlFromPath('identities/jira.png'),
  member: {
    placeholder: 'Jira username or email address',
  },
  activity: {
    showLink: true,
    showSourceId: true,
  },
  conversation: {
    replyContent: (conversation) => ({
      icon: 'reply',
      copy: 'reply',
      number: conversation.activityCount - 1,
    }),
  },
};

export default jira;
