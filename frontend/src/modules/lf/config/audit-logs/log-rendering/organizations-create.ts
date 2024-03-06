import { LogRenderingConfig } from '@/modules/lf/config/audit-logs/log-rendering/index';

const organizationsCreate: LogRenderingConfig = {
  label: 'Organization created',
  changes: (log) => ({
    removals: [],
    additions: [],
    changes: [],
  }),
};

export default organizationsCreate;
