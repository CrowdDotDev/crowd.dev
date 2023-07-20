import { AutomationTypeConfig } from '@/modules/automation/config/automation-types/index';
import config from '@/config';
import { AuthToken } from '@/modules/auth/auth-token';

export const slack: AutomationTypeConfig = {
  name: 'Slack notification',
  description: 'Send notifications to your Slack workspace',
  icon: 'https://cdn-icons-png.flaticon.com/512/3800/3800024.png',
  emptyScreen: {
    title: 'No Slack notifications yet',
    body: 'Send Slack notifications when a new activity happens, or a new member joins your community',
  },
  canCreate(store) {
    const tenant = store.getters['auth/currentTenant'];
    return !!tenant.settings[0].slackWebHook;
  },
  actionButton(store) {
    const tenant = store.getters['auth/currentTenant'];
    const slackConnected = !!tenant.settings[0].slackWebHook;
    if (slackConnected) {
      return null;
    }
    return {
      label: 'Install app',
      action: () => {
        const redirectUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?activeTab=automations&success=true`;
        const slackConnectUrl = `${config.backendUrl}/tenant/${
          tenant.id
        }/automation/slack?redirectUrl=${redirectUrl}&crowdToken=${AuthToken.get()}`;

        window.open(slackConnectUrl, '_self');
      },
    };
  },
};
