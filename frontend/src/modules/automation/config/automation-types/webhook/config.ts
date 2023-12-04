import { AutomationTypeConfig } from '@/modules/automation/config/automation-types';
import AutomationsWebhookAction from './webhook-action.vue';
import AutomationsTriggerMemberActivity from '../shared/trigger-member-activity.vue';

export const webhook: AutomationTypeConfig = {
  name: 'Webhook',
  description: 'Send webhook payloads to automate workflows',
  icon: '/images/automation/webhook.png',
  emptyScreen: {
    title: 'No Webhooks yet',
    body: 'Create webhook actions when a new activity happens, or a new contact joins your community',
  },
  triggerText: 'Define the event that triggers your webhook',
  actionText: 'Define the endpoint where the webhook payload should be sent to',
  createButtonText: 'Add webhook',
  canCreate: () => true,
  actionComponent: AutomationsWebhookAction,
  triggerComponent: AutomationsTriggerMemberActivity,
};
