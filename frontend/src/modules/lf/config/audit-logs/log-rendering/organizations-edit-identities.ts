import { LogRenderingConfig } from '@/modules/lf/config/audit-logs/log-rendering/index';
import { CrowdIntegrations } from '@/integrations/integrations-config';

function getIdentityKey(identity: any): string {
  return `${identity.name}-${identity.platform}`;
}

function convertToMap(state: any[]): Map<string, any> {
  const stateMap = new Map<string, any>();
  state.forEach((identity) => {
    stateMap.set(getIdentityKey(identity), identity);
  });
  return stateMap;
}

const organizationsEditIdentities: LogRenderingConfig = {
  label: 'Organization identities edited',
  changes: (log) => {
    const additions: any[] = [];
    const removals: any[] = [];

    // Convert state arrays to maps for efficient lookup
    const oldStateMap = convertToMap(log.oldState);
    const newStateMap = convertToMap(log.newState);

    log.oldState.forEach((identity) => {
      const newIdentity = newStateMap.get(getIdentityKey(identity));
      if (!newIdentity) {
        removals.push(identity);
      }
    });

    log.newState.forEach((identity) => {
      const oldIdentity = oldStateMap.get(getIdentityKey(identity));
      if (!oldIdentity) {
        additions.push(identity);
      }
    });

    return {
      additions: additions.map((p) => `${CrowdIntegrations.getConfig(p.platform)?.name || p.platform}: ${p.name}`),
      removals: removals.map((p) => `${CrowdIntegrations.getConfig(p.platform)?.name || p.platform}: ${p.name}`),
      changes: [],
    };
  },
  description: (log) => `ID: ${log.entityId}`,
  properties: (log) => [{
    label: 'Organization',
    value: `ID: ${log.entityId}</span>`,
  }],
};

export default organizationsEditIdentities;
