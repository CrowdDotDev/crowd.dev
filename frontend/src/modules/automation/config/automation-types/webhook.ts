import { AutomationTypeConfig } from '@/modules/automation/config/automation-types/index';

export const webhook: AutomationTypeConfig = {
  name: 'Webhook',
  description: 'Send webhook payloads to automate workflows',
  icon: '/images/automation/webhook.png',
  emptyScreen: {
    title: 'No Webhooks yet',
    body: 'Create webhook actions when a new activity happens, or a new member joins your community',
  },
  canCreate: () => true,
};
