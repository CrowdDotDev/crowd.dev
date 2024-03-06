import { LogRenderingConfig } from '@/modules/lf/config/audit-logs/log-rendering/index';

const integrationsReconnect: LogRenderingConfig = {
  label: 'Integration reconnected',
  changes: (log) => ({
    removals: [],
    additions: [],
    changes: [],
  }),
};

export default integrationsReconnect;
