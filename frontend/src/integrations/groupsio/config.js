import config from '@/config';

export default {
  enabled: config.isGroupsioIntegrationEnabled,
  hideAsIntegration: !config.isGroupsioIntegrationEnabled,
  name: 'Groups.io',
  backgroundColor: '#FFFFFF',
  borderColor: '#FFFFFF',
  description:
    'Connect Groups.io to sync groups and topics activity.',
  image:
    '/images/integrations/groupsio.svg',
  url: ({ username }) => null,
  chartColor: '#111827',
  showProfileLink: true,
  placeholder: 'Groups.io email address',
  activityDisplay: {
    showLinkToUrl: true,
  },
};
