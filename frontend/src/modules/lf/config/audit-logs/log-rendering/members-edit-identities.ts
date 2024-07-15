import { LogRenderingConfig } from '@/modules/lf/config/audit-logs/log-rendering/index';
import { CrowdIntegrations } from '@/integrations/integrations-config';

const membersEditIdentities: LogRenderingConfig = {
  label: 'Profile identities updated',
  changes: (log) => {
    const removals = [];
    const additions = [];
    const changes = [];

    Object.keys(log.oldState).forEach((platform) => {
      log.oldState[platform].forEach((identity) => {
        if (!log.newState[platform] || log.newState[platform].length === 0 || !log.newState[platform].includes(identity)) {
          removals.push(`${CrowdIntegrations.getConfig(platform)?.name || platform} username: ${identity}`);
        }
      });
    });

    // Check for additions in newState
    Object.keys(log.newState).forEach((platform) => {
      log.newState[platform].forEach((identity) => {
        if (!log.oldState[platform] || !log.oldState[platform].includes(identity)) {
          additions.push(`${CrowdIntegrations.getConfig(platform)?.name || platform} username: ${identity}`);
        }
      });
    });

    return { removals, additions, changes };
  },
  description: (log) => `ID: ${log.entityId}`,
  properties: (log) => [{
    label: 'Profile',
    value: `<span>ID: ${log.entityId}</span>`,
  }],
};

export default membersEditIdentities;
