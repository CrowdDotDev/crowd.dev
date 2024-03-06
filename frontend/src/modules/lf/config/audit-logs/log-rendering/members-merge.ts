import { LogRenderingConfig } from '@/modules/lf/config/audit-logs/log-rendering/index';

const membersMerge: LogRenderingConfig = {
  label: 'Contributor merged',
  changes: (log) => ({
    removals: [],
    additions: [],
    changes: [],
  }),
};

export default membersMerge;
