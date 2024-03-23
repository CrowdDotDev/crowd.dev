import config from '@/config';
import JiraConnect from './components/jira-connect.vue';

export default {
  enabled: config.isJiraEnabled,
  hideAsIntegration: !config.isJiraEnabled,
  name: 'Jira',
  backgroundColor: '#FFFFFF',
  borderColor: '#FFFFFF',
  description:
    'Connect Jira to sync issue activities from your projects.',
  onboard: {
    description: 'Sync issue activities from your projects.',
  },
  image:
    '/images/integrations/jira.png',
  connectComponent: JiraConnect,
  url: () => null,
  showProfileLink: false,
  chartColor: '#E5512C',
  activityDisplay: {
    showContentDetails: false,
    showLinkToUrl: true,
    showSourceId: true,
    typeIcon: 'jira',
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
  organization: {
    handle: (identity) => (identity.url ? identity.url.split('/').at(-1) : identity.name),
  },
};
