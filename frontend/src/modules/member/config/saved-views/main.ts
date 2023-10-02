import { SavedViewsConfig } from '@/shared/modules/saved-views/types/SavedViewsConfig';
import allMembers from './views/all-members';

import bot from './settings/bot/config';
import teamMember from './settings/teamMember/config';
import organization from './settings/organization/config';

export const memberSavedViews: SavedViewsConfig = {
  defaultView: allMembers,
  settings: {
    teamMember,
    bot,
    organization,
  },
  sorting: {
    displayName: 'Member',
    activityCount: '# of activities',
    score: 'Engagement level',
    lastActive: 'Last activity',
    joinedAt: 'Joined date',
    numberOfOpenSourceContributions: '# of OSS contributions',
  },
};
