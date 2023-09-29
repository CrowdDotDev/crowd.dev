import { SavedView, SavedViewsConfig } from '@/shared/modules/saved-views/types/SavedViewsConfig';
import allMembers from './views/all-members';
import newAndActive from './views/new-and-active';
import slippingAway from './views/slipping-away';
import mostEngaged from './views/most-engaged';
import influential from './views/influential';
import teamMembers from './views/team-members';

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
};

// Hardcoded views until we have backend done for it
export const memberViews: SavedView[] = [
  newAndActive,
  slippingAway,
  mostEngaged,
  influential,
  teamMembers,
];
