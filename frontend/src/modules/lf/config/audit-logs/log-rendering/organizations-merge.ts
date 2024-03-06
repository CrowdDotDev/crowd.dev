import { LogRenderingConfig } from '@/modules/lf/config/audit-logs/log-rendering/index';

const organizationsMerge: LogRenderingConfig = {
  label: 'Organizations merged',
  changes: (log) => ({
    removals: [],
    additions: [],
    changes: [],
  }),
};

export default organizationsMerge;
