import { IdentityConfig } from '@/config/identities';

const jira: IdentityConfig = {
  key: 'jira',
  name: 'Jira',
  image: '/images/identities/jira.png',
  member: {
    placeholder: 'Jira username or email address',
  },
  activity: {
    showLink: true,
    showSourceId: true,
  },
  conversation: {
    replyContent: (conversation) => ({
      icon: 'ri-reply-line',
      copy: 'reply',
      number: conversation.activityCount - 1,
    }),
  },
};

export default jira;
