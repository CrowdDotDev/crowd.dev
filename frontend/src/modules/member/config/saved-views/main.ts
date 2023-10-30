import { SavedViewsConfig } from '@/shared/modules/saved-views/types/SavedViewsConfig';
import allContacts from './views/all-contacts';

import bot from './settings/bot/config';
import teamMember from './settings/teamMember/config';
import organization from './settings/organization/config';

export const memberSavedViews: SavedViewsConfig = {
  defaultView: allContacts,
  settings: {
    teamMember,
    bot,
    organization,
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
