import { IdentityConfig } from '@/config/identities';

const jira: IdentityConfig = {
  key: 'jira',
  name: 'Jira',
  image: '/src/assets/images/identities/jira.png',
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
