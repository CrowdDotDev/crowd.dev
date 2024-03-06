import { LogRenderingConfig } from '@/modules/lf/config/audit-logs/log-rendering/index';

const membersCreate: LogRenderingConfig = {
  label: 'Contributor created',
  changes: (log) => ({
    removals: [],
    additions: [],
    changes: [],
  }),
};

export default membersCreate;
