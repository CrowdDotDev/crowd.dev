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
    memberCount: '# contacts',
    activityCount: '# activities',
    joinedAt: 'Joined date',
    founded: 'Founded',
  },
};
