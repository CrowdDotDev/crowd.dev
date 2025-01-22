import { IdentityConfig } from '@/config/identities';

const github: IdentityConfig = {
  key: 'github',
  name: 'GitHub',
  image: '/images/identities/github.png',
  icon: 'github-fill',
  color: '#24292F',
  member: {
    urlPrefix: 'github.com/',
    url: ({ identity }) => (identity.value ? `https://github.com/${identity.value}` : null),
  },
  organization: {
    urlPrefix: 'github.com/',
  },
  activity: {
    showLink: true,
  },
  conversation: {
    showLabels: true,
    separatorContent: 'activity',
    replyContent: (conversation) => {
      const activities = conversation.lastReplies || conversation.activities;

      return {
        icon: 'ri-chat-4-line',
        copy: 'comment',
        number: activities.reduce((acc, activity) => {
          if (activity.type.includes('comment')) {
            return acc + 1;
          }

          return acc;
        }, 0),
      };
    },
    attributes: (attributes) => ({
      changes: attributes.changedFiles,
      changesCopy: 'file change',
      insertions: attributes.additions,
      deletions: attributes.deletions,
    }),
  },
};

export default github;
