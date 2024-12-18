import config from '@/config';

export default {
  enabled: true,
  name: 'Jira',
  backgroundColor: '#FFFFFF',
  borderColor: '#FFFFFF',
  description:
    'Connect Jira to sync issues activities from your projects.',
  onboard: {
    description: 'Sync issue activities from your projects.',
  },
  image:
    '/images/integrations/jira.png',
  url: () => null,
  showProfileLink: false,
  placeholder: 'Jira username or email address',
  chartColor: '#E5512C',
  activityDisplay: {
    showContentDetails: false,
    showLinkToUrl: true,
    showSourceId: true,
    typeIcon: 'jira',
  },
  conversationDisplay: {
    replyContent: (conversation) => ({
      icon: 'ri-reply-line',
      copy: 'reply',
      number: conversation.activityCount - 1,
    }),
  },
  organization: {
    handle: (identity) => (identity.url ? identity.url.split('/').at(-1) : identity.name),
  },
};
