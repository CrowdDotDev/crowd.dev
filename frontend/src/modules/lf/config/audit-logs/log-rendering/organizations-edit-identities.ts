import { LogRenderingConfig } from '@/modules/lf/config/audit-logs/log-rendering/index';

const organizationsEditIdentities: LogRenderingConfig = {
  label: 'Organization identities edited',
  changes: () => ({
    removals: [],
    additions: [],
    changes: [],
  }),
  description: (log) => {
    const organization = log.newState?.displayName;
    if (organization) {
      return `${organization}<br>ID: ${log.entityId}`;
    }
    return '';
  },
  properties: (log) => {
    const organization = log.newState?.displayName;
    if (organization) {
      return [{
        label: 'Organization',
        value: `${organization}<br><span>ID: ${log.entityId}</span>`,
      }];
    }
    return [];
  },
};

export default organizationsEditIdentities;
