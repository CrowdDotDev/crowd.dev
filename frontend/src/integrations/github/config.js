import GithubConnect from './components/github-connect.vue';

export default {
  enabled: true,
  name: 'GitHub',
  backgroundColor: '#E5E7EB',
  borderColor: '#E5E7EB',
  brandColor: '#24292F',
  description:
    'Connect GitHub to sync profile information, stars, forks, pull requests, issues, and discussions.',
  onboard: {
    description: `GitHub is one of the richest places for developer activity and information. 
      Connect GitHub to track all relevant activities with no historical import limitations like repo stars, discussions, comments, and more.`,
    image: '/images/integrations/onboard/onboard-github-preview.png',
    highlight: true,
  },
  image:
    'https://cdn-icons-png.flaticon.com/512/25/25231.png',
  icon: 'github-fill',
  connectComponent: GithubConnect,
  url: ({ username }) => (username ? `https://github.com/${username}` : null),
  chartColor: '#111827',
  showProfileLink: true,
  urlPrefix: 'github.com/',
  showProgress: true,
  activityDisplay: {
    showLinkToUrl: true,
  },
  conversationDisplay: {
    showLabels: true,
    showConversationAttributes: true,
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
  organization: {
    identityHandle: ({ identityHandle }) => identityHandle,
    identityLink: ({ identityHandle }) => `https://github.com/${identityHandle}`,
  },
};
