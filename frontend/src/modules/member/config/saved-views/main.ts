import { SavedView, SavedViewsConfig } from '@/shared/modules/saved-views/types/SavedViewsConfig';
import allContacts from './views/all-contacts';
import newAndActive from './views/new-and-active';
import slippingAway from './views/slipping-away';
import mostEngaged from './views/most-engaged';
import influential from './views/influential';
import teamMembers from './views/team-members';

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
    displayName: 'Member',
    activityCount: '# of activities',
    score: 'Engagement level',
    lastActive: 'Last activity',
    joinedAt: 'Joined date',
    numberOfOpenSourceContributions: '# of OSS contributions',
  },
};

export const memberViews: SavedView[] = [
  newAndActive,
  slippingAway,
  mostEngaged,
  influential,
  teamMembers,
];
