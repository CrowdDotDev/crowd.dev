import { IdentityConfig } from '@/config/identities';

const gitlab: IdentityConfig = {
  key: 'gitlab',
  name: 'GitLab',
  image: '/images/identities/gitlab.png',
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
      icon: 'ri-chat-4-line',
      copy: 'comment',
      number: conversation.activityCount - 1,
    }),
  },
};

export default gitlab;
