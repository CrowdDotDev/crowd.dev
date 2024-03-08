import { LogRenderingConfig } from '@/modules/lf/config/audit-logs/log-rendering/index';

const membersEditProfile: LogRenderingConfig = {
  label: 'Contributor profile edited',
  changes: () => ({
    removals: [],
    additions: [],
    changes: [],
  }),
  description: (log) => {
    const contributor = log.newState?.displayName;
    if (contributor) {
      return `${contributor}<br>ID: ${log.entityId}`;
    }
    return '';
  },
  properties: (log) => {
    const contributor = log.newState?.displayName;
    if (contributor) {
      return [{
        label: 'Contributor',
        value: `${contributor}<br><span>ID: ${log.entityId}</span>`,
      }];
    }
    return [];
  },
};

export default membersEditProfile;
