import { SavedViewsConfig } from '@/shared/modules/saved-views/types/SavedViewsConfig';
import { memberDefaultFilterRenderer } from '@/shared/modules/filters/config/defaultFilterRenderer/member.defaultFilter.renderer';
import allContacts from './views/all-contacts';

import bot from './settings/bot/config';
import teamMember from './settings/teamMember/config';
import organization from './settings/organization/config';
import deleted from './settings/deleted/config';

export const memberSavedViews: SavedViewsConfig = {
  defaultView: allContacts,
  settings: {
    teamMember,
    bot,
    organization,
    deleted,
  },
  defaultFilters: {
    render: memberDefaultFilterRenderer,
  },
  sorting: {
    displayName: 'Contact',
    activityCount: '# of activities',
    score: 'Engagement level',
    lastActive: 'Last activity',
    joinedAt: 'Joined date',
    numberOfOpenSourceContributions: '# of OSS contributions',
  },
};
