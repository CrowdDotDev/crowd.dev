import { SavedViewsConfig } from '@/shared/modules/saved-views/types/SavedViewsConfig';
import { organizationDefaultFilterRenderer } from '@/shared/modules/filters/config/defaultFilterRenderer/organization.defaultFilter.renderer';
import allOrganizations from './views/all-organizations';

import teamOrganization from './settings/teamOrganization/config';
import hasActivities from './settings/hasActivities/config';

export const organizationSavedViews: SavedViewsConfig = {
  defaultView: allOrganizations,
  settings: {
    teamOrganization,
    hasActivities,
  },
  defaultFilters: {
    render: organizationDefaultFilterRenderer,
  },
  sorting: {
    displayName: 'Organization',
    memberCount: '# people',
    activityCount: '# activities',
    joinedAt: 'Joined date',
    founded: 'Founded',
  },
};

export const commonOrganizationSavedViews: SavedViewsConfig = {
  defaultView: {
    id: 'common-organizations',
    name: 'Common organizations',
    visibility: 'tenant',
    placement: 'organization',
    config: {
      search: '',
      relation: 'and',
      order: {
        prop: 'activityCount',
        order: 'descending',
      },
      settings: {
        hasActivities: 'true',
      },
    },
  },
  settings: {
    hasActivities,
  },
  defaultFilters: {
    render: organizationDefaultFilterRenderer,
  },
  sorting: {},
};
