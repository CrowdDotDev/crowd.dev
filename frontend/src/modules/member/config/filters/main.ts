import { FilterConfig } from '@/shared/modules/filters/types/FilterConfig';
import { SearchFilterConfig } from '@/shared/modules/filters/types/filterTypes/SearchFilterConfig';
import noOfActivities from './noOfActivities/config';
import noOfOSSContributions from './noOfOSSContributions/config';
import activeOn from './activeOn/config';
import activityType from './activityType/config';
import avgSentiment from './avgSentiment/config';
import engagementLevel from './engagementLevel/config';
import enrichedMember from './enrichedMember/config';
import identities from './identities/config';
import joinedDate from './joinedDate/config';
import lastActivityDate from './lastActivityDate/config';
import reach from './reach/config';
import projects from './projects/config';
import tags from './tags/config';

export const memberFilters: Record<string, FilterConfig> = {
  noOfActivities,
  noOfOSSContributions,
  activeOn,
  activityType,
  avgSentiment,
  engagementLevel,
  enrichedMember,
  identities,
  joinedDate,
  lastActivityDate,
  reach,
  projects,
  tags,
};

export const memberSearchFilter: SearchFilterConfig = {
  placeholder: 'Search contributors',
  apiFilterRenderer(value: string): any[] {
    return [
      {
        or: [
          { displayName: { textContains: value } },
          { emails: { like: value } },
        ],
      },
    ];
  },
};
