import { LogRenderingConfig } from '@/modules/lf/config/audit-logs/log-rendering/index';
import moment from 'moment';

const formatDateRange = (dateStart, dateEnd) => {
  // eslint-disable-next-line no-nested-ternary
  const dateStartFormat = dateStart
    ? moment(dateStart).utc().format('MMMM YYYY')
    : 'Unknown';
  // eslint-disable-next-line no-nested-ternary
  const dateEndFormat = dateEnd
    ? moment(dateEnd).utc().format('MMMM YYYY')
    : (dateStart ? 'Present' : 'Unknown');
  return `${dateStartFormat} -> ${dateEndFormat}`;
};

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
        changes.removals.push(`<span>Organization Id:</span> ${org.organizationId}`);
      } else {
        const newOrg = newStateMap.get(org.organizationId);
        if (org.dateStart !== newOrg.dateStart || org.dateEnd !== newOrg.dateEnd || org.title !== newOrg.title) {
          changes.changes.push(`<span>Organization Id:</span> ${org.organizationId}
            <br><s>${org.title}: ${formatDateRange(org.dateStart, org.dateEnd)}</s>
            <br>${newOrg.title}: ${formatDateRange(newOrg.dateStart, newOrg.dateEnd)}
          `)
        }
      }
    });

    // Check for additions
    log.newState.forEach((org) => {
      if (!oldStateMap.has(org.organizationId)) {
        changes.additions.push(`<span>Organization Id:</span> ${org.organizationId}`);
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
