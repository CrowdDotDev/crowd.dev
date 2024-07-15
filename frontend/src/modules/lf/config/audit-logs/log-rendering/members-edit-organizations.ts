import { LogRenderingConfig } from '@/modules/lf/config/audit-logs/log-rendering/index';
import moment from 'moment';
import { OrganizationService } from '@/modules/organization/organization-service';
// import { OrganizationService } from '@/modules/organization/organization-service';

const formatDateRange = (dateStart, dateEnd) => {
  // eslint-disable-next-line no-nested-ternary
  const dateStartFormat = dateStart
    ? moment(dateStart)
      .utc()
      .format('MMMM YYYY')
    : 'Unknown';
  // eslint-disable-next-line no-nested-ternary
  const dateEndFormat = dateEnd
    ? moment(dateEnd)
      .utc()
      .format('MMMM YYYY')
    : (dateStart ? 'Present' : 'Unknown');
  return `${dateStartFormat} -> ${dateEndFormat}`;
};

const membersEditOrganizations: LogRenderingConfig = {
  label: 'Profile work experience updated',
  changes: async (log) => {
    const changes = {
      removals: [],
      additions: [],
      changes: [],
    };

    const oldStateMap = new Map(log.oldState.map((org) => [org.organizationId, org]));
    const newStateMap = new Map(
      log.newState
        .filter((org) => !!org.dateStart && !!org.dateEnd)
        .map((org) => [org.organizationId, org]),
    );

    const orgIds = [
      ...new Set([
        ...log.oldState.map((org) => org.organizationId),
        ...log.newState.map((org) => org.organizationId),
      ]),
    ];

    const orgs = await OrganizationService.listByIds(orgIds);
    const orgById = orgs.reduce((obj, org) => ({
      ...obj,
      [org.id]: org.displayName,
    }), {});

    // Check for removals and modifications
    log.oldState.forEach((org) => {
      if (!newStateMap.has(org.organizationId)) {
        changes.removals.push(`<span>Organization:</span> ${org.organizationId ? (orgById[org.organizationId]) : 'Individual'}`);
      } else {
        const newOrg = newStateMap.get(org.organizationId);
        if (
          formatDateRange(org.dateStart, org.dateEnd) !== formatDateRange(newOrg.dateStart, newOrg.dateEnd)
          || (org.title || '') !== (newOrg.title || '')) {
          changes.changes.push(`<span>Organization:</span> ${org.organizationId ? (orgById[org.organizationId]) : 'Individual'}
            <br><s>${org.title ? `${org.title}: ` : ''}${formatDateRange(org.dateStart, org.dateEnd)}</s>
            <br>${newOrg.title ? `${org.title}: ` : ''}${formatDateRange(newOrg.dateStart, newOrg.dateEnd)}
          `);
        }
      }
    });

    // Check for additions
    log.newState.forEach((org) => {
      if (!oldStateMap.has(org.organizationId)) {
        changes.additions.push(`<span>Organization:</span> ${org.organizationId ? (orgById[org.organizationId]) : 'Individual'}`);
      }
    });

    return changes;
  },
  description: (log) => `ID: ${log.entityId}`,
  properties: (log) => [{
    label: 'Profile',
    value: `<span>ID: ${log.entityId}</span>`,
  }],
};

export default membersEditOrganizations;
