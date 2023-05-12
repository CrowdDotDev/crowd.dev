import config from '@/config';
import GitConnect from './components/git-connect.vue';

export default {
  enabled: config.isGitEnabled,
  hideAsIntegration: !config.isGitEnabled,
  name: 'Git',
  backgroundColor: '#FFFFFF',
  borderColor: '#FFFFFF',
  description:
    'Connect Git to sync commit activities from your repos.',
  image:
    '/images/integrations/git.png',
  connectComponent: GitConnect,
  url: (username) => `https://github.com/${username}`,
  chartColor: '#E5512C',
  activityDisplay: {
    showContentDetails: true,
    showLinkToUrl: false,
    showSourceId: true,
    typeIcon: 'commit',
  },
  conversationDisplay: {
    showConversationAttributes: true,
    replyContent: () => null,
    attributes: (attributes) => ({
      changes: attributes.lines,
      changesCopy: 'line',
      insertions: attributes.insertions,
      deletions: attributes.deletions,
    }),
  },
};
