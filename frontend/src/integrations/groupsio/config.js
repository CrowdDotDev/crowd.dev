import config from '@/config';
import GroupsioConnect from './components/groupsio-connect.vue';

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
  connectComponent: GroupsioConnect,
  chartColor: '#111827',
  showProfileLink: true,
  activityDisplay: {
    showLinkToUrl: true,
  },
};
