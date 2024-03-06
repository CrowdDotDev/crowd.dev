import { LogRenderingConfig } from '@/modules/lf/config/audit-logs/log-rendering/index';

const membersEditOrganizations: LogRenderingConfig = {
  label: 'Contributor organizations edited',
  changes: (log) => ({
    removals: [],
    additions: [],
    changes: [],
  }),
};

export default membersEditOrganizations;
