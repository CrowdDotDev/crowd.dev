import { IdentityConfig } from '@/config/identities';

const image = new URL('@/assets/images/identities/jira.png', import.meta.url)
  .href;

const jira: IdentityConfig = {
  key: 'jira',
  name: 'Jira',
  image,
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
