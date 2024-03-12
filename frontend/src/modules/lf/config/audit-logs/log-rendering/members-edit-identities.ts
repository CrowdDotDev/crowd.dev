import { LogRenderingConfig } from '@/modules/lf/config/audit-logs/log-rendering/index';

const membersEditIdentities: LogRenderingConfig = {
  label: 'Contributor identities edited',
  changes: (log) => {
    const removals = [];
    const additions = [];
    const changes = [];

    // Check for removals and changes in oldState compared to newState
    Object.keys(log.oldState).forEach((platform) => {
      log.oldState[platform].forEach((identity) => {
        if (!log.newState[platform] || log.newState[platform].length === 0 || log.newState[platform].delete) {
          removals.push(`${platform} username: ${identity.username}`);
        } else {
          const newIdentity = log.newState[platform].find((id) => id.username === identity.username);
          if (newIdentity && identity.username !== newIdentity.username) {
            changes.push(`${platform} username: <s>${identity.username}</s> <b>${newIdentity.username}</b>`);
          }
        }
      });
    });

    // Check for additions in newState
    Object.keys(log.newState).forEach((platform) => {
      if (Array.isArray(log.newState[platform])) {
        log.newState[platform].forEach((identity) => {
          if (!log.oldState[platform] || !log.oldState[platform].find((id) => id.username === identity.username)) {
            additions.push(`${platform} username: ${identity.username}`);
          }
        });
      } else if (typeof log.newState[platform] === 'object' && !log.oldState[platform]) {
        // If the newState for a platform is an object and not an array, and there's no corresponding oldState
        additions.push(`${platform} username: ${log.newState[platform].username}`);
      }
    });

    return { removals, additions, changes };
  },
  description: (log) => `ID: ${log.entityId}`,
  properties: (log) => [{
    label: 'Contributor',
    value: `<span>ID: ${log.entityId}</span>`,
  }],
};

export default membersEditIdentities;
