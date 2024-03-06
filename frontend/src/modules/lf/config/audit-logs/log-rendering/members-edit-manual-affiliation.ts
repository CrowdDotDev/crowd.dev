import { LogRenderingConfig } from '@/modules/lf/config/audit-logs/log-rendering/index';

const membersEditManualAffiliation: LogRenderingConfig = {
  label: 'Contributor manual affiliations edited',
  changes: (log) => ({
    removals: [],
    additions: [],
    changes: [],
  }),
};

export default membersEditManualAffiliation;
