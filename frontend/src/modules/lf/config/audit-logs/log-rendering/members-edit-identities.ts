import { LogRenderingConfig } from '@/modules/lf/config/audit-logs/log-rendering/index';

const membersEditIdentities: LogRenderingConfig = {
  label: 'Contributor identities edited',
  changes: (log) => ({
    removals: [],
    additions: [],
    changes: [],
  }),
};

export default membersEditIdentities;
