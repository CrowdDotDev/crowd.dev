import { LogRenderingConfig } from '@/modules/lf/config/audit-logs/log-rendering/index';

const organizationsEditIdentities: LogRenderingConfig = {
  label: 'Organization identities edited',
  changes: (log) => ({
    removals: [],
    additions: [],
    changes: [],
  }),
};

export default organizationsEditIdentities;
