import { IdentityConfig } from '@/config/identities';

const image = new URL('@/assets/images/identities/slack.png', import.meta.url)
  .href;

const slack: IdentityConfig = {
  key: 'slack',
  name: 'Slack',
  image,
  member: {
    placeholder: 'Slack username or email address',
    url: ({ identity }) => (identity.value ? `https://slack.com/${identity.value}` : null),
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

export default slack;
