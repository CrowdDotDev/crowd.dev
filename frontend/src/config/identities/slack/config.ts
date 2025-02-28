import { IdentityConfig } from '@/config/identities';
import { getImageUrlFromPath } from '@/utils/image-loader';

const slack: IdentityConfig = {
  key: 'slack',
  name: 'Slack',
  image: getImageUrlFromPath('identities/slack.png'),
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
