import { SavedViewsConfig } from '@/shared/modules/saved-views/types/SavedViewsConfig';
import allOrganizations from './views/all-organizations';

import teamOrganization from './settings/teamOrganization/config';

export const organizationSavedViews: SavedViewsConfig = {
  defaultView: allOrganizations,
  settings: {
    teamOrganization,
  },
  sorting: {
    displayName: 'Organization',
    memberCount: '# contacts',
    activityCount: '# activities',
    joinedAt: 'Joined date',
    founded: 'Founded',
  },
};
