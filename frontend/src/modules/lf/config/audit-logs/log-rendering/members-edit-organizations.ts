import { LogRenderingConfig } from '@/modules/lf/config/audit-logs/log-rendering/index';

const membersEditOrganizations: LogRenderingConfig = {
  label: 'Contributor organizations edited',
  changes: (log) => {
    const changes = {
      removals: [],
      additions: [],
      changes: [],
    };

    const oldStateMap = new Map(log.oldState.map((org) => [org.organizationId, org]));
    const newStateMap = new Map(log.newState.map((org) => [org.organizationId, org]));

    // Check for removals and modifications
    log.oldState.forEach((org) => {
      if (!newStateMap.has(org.organizationId)) {
        changes.removals.push(`Organization: ${JSON.stringify(org)}`);
      } else {
        const newOrg = newStateMap.get(org.organizationId);
        if (org.dateStart !== newOrg.dateStart || org.dateEnd !== newOrg.dateEnd || org.title !== newOrg.title) {
          changes.changes.push(JSON.stringify({
            organizationId: org.organizationId,
            old: { dateStart: org.dateStart, dateEnd: org.dateEnd, title: org.title },
            new: { dateStart: newOrg.dateStart, dateEnd: newOrg.dateEnd, title: newOrg.title },
          }));
        }
      }
    });

    // Check for additions
    log.newState.forEach((org) => {
      if (!oldStateMap.has(org.organizationId)) {
        changes.additions.push(`Organization: ${JSON.stringify(org)}`);
      }
    });

    console.log(changes);

    return changes;
  },
  description: (log) => `ID: ${log.entityId}`,
  properties: (log) => [{
    label: 'Contributor',
    value: `<span>ID: ${log.entityId}</span>`,
  }],
};

export default membersEditOrganizations;
