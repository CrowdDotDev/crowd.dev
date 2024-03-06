import { LogRenderingConfig } from '@/modules/lf/config/audit-logs/log-rendering/index';

const membersEditProfile: LogRenderingConfig = {
  label: 'Contributor profile edited',
  changes: (log) => ({
    removals: [],
    additions: [],
    changes: [],
  }),
};

export default membersEditProfile;
