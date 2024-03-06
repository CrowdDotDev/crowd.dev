import { LogRenderingConfig } from '@/modules/lf/config/audit-logs/log-rendering/index';

const organizationsEditProfile: LogRenderingConfig = {
  label: 'Organization profile edited',
  changes: (log) => ({
    removals: [],
    additions: [],
    changes: [],
  }),
};

export default organizationsEditProfile;
