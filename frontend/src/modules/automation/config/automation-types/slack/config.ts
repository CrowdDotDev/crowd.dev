import { AutomationTypeConfig } from '@/modules/automation/config/automation-types';
import config from '@/config';

import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';
import { AuthService } from '@/modules/auth/services/auth.service';
import AutomationsTriggerMemberActivity from '../shared/trigger-member-activity.vue';
import AutomationsSlackAction from './slack-action.vue';

export const slack: AutomationTypeConfig = {
  name: 'Slack notification',
  description: 'Send notifications to your Slack workspace',
  icon: 'https://cdn-icons-png.flaticon.com/512/3800/3800024.png',
  emptyScreen: {
    title: 'No Slack notifications yet',
    body: 'Send Slack notifications when a new activity happens, or a new person joins your community',
  },
  triggerText: 'Define the event that triggers your Slack notification.',
  actionText: 'Receive a notification in your Slack workspace every time the event is triggered.',
  createButtonText: 'Add Slack notification',
  canCreate() {
    const authStore = useAuthStore();
    const { tenant } = storeToRefs(authStore);
    return !!tenant.value?.settings[0].slackWebHook;
  },
  actionButton() {
    const authStore = useAuthStore();
    const { tenant } = storeToRefs(authStore);
    const slackConnected = !!tenant.value?.settings[0].slackWebHook;
    if (slackConnected) {
      return null;
    }
    return {
      label: 'Install app',
      action: () => {
        const redirectUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?activeTab=automations&success=true`;
        const slackConnectUrl = `${config.backendUrl}/tenant/${
          tenant.value?.id
        }/automation/slack?redirectUrl=${redirectUrl}&crowdToken=${AuthService.getToken()}`;

        window.open(slackConnectUrl, '_self');
      },
    };
  },
  actionComponent: AutomationsSlackAction,
  triggerComponent: AutomationsTriggerMemberActivity,
};
