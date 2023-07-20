import { AutomationTypeConfig } from '@/modules/automation/config/automation-types/index';
import { CrowdIntegrations } from '@/integrations/integrations-config';

export const hubspot: AutomationTypeConfig = {
  name: 'HubSpot',
  description: 'Send members or organizations to HubSpot',
  icon: '/images/integrations/hubspot.png',
  canCreate(store) {
    const hubspot = CrowdIntegrations.getMappedConfig('hubspot', store);
    return hubspot.status === 'done';
  },
  disabled(store) {
    const hubspot = CrowdIntegrations.getMappedConfig('hubspot', store);
    return hubspot.status !== 'done';
  },
};
