import { AutomationTypeConfig } from '@/modules/automation/config/automation-types';
// import { CrowdIntegrations } from '@/integrations/integrations-config';
import AutomationsHubspotAction from './hubspot-action.vue';
import AutomationsHubspotTrigger from './hubspot-trigger.vue'

export const hubspot: AutomationTypeConfig = {
  name: 'HubSpot',
  description: 'Send members or organizations to HubSpot',
  icon: '/images/integrations/hubspot.png',
  triggerText: 'Define the conditions that will trigger your HubSpot action.',
  actionText: 'Define which action will take place in HubSpot based on the defined conditions.',
  canCreate(store) {
    return true;
    // const hubspot = CrowdIntegrations.getMappedConfig('hubspot', store);
    // return hubspot.status === 'done';
  },
  disabled(store) {
    return false;
    // const hubspot = CrowdIntegrations.getMappedConfig('hubspot', store);
    // return hubspot.status !== 'done';
  },
  actionComponent: AutomationsHubspotAction,
  triggerComponent: AutomationsHubspotTrigger,
};
