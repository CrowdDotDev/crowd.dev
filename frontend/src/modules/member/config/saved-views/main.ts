import { SavedView, SavedViewsConfig } from '@/shared/modules/saved-views/types/SavedViewsConfig';
import { memberDefaultFilterRenderer } from '@/shared/modules/filters/config/defaultFilterRenderer/member.defaultFilter.renderer';
import allMembers from './views/all-members';
import unaffiliated from './views/unaffiliated';
import toReview from './views/to-review';
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
  defaultFilters: {
    render: memberDefaultFilterRenderer,
  },
  sorting: {
    displayName: 'Person',
    activityCount: '# of activities',
    score: 'Engagement level',
    lastActive: 'Last activity',
    joinedAt: 'Joined date',
    numberOfOpenSourceContributions: '# of OSS contributions',
  },
};

export const memberStaticViews: SavedView[] = [
  unaffiliated,
  toReview,
];
