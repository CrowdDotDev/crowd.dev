import { LogRenderingConfig } from '@/modules/lf/config/audit-logs/log-rendering/index';
import { CrowdIntegrations } from '@/integrations/integrations-config';

const integrationsReconnect: LogRenderingConfig = {
  label: 'Integration re-connected',
  changes: () => null,
  description: (log) => {
    const integration = CrowdIntegrations.getConfig(log.newState?.platform || log.oldState?.platform);
    if (integration) {
      return `Integration: ${integration.name}`;
    }
    return '';
  },
  properties: (log) => {
    const integration = CrowdIntegrations.getConfig(log.newState?.platform || log.oldState?.platform);
    if (integration) {
      return [{
        label: 'Integration',
        value: integration.name,
      }];
    }
    return [];
  },
};

export default integrationsReconnect;
