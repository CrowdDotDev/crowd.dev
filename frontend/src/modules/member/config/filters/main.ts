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
import tags from './tags/config';
import memberName from './memberName/config';
import jobTitle from './jobTitle/config';
import organizations from './organizations/config';

export const memberFilters: Record<string, FilterConfig> = {
  memberName,
  organizations,
  noOfActivities,
  noOfOSSContributions,
  jobTitle,
  activeOn,
  activityType,
  avgSentiment,
  engagementLevel,
  enrichedMember,
  identities,
  joinedDate,
  lastActivityDate,
  reach,
  tags,
};

export const memberSearchFilter: SearchFilterConfig = {
  placeholder: 'Search contacts',
  apiFilterRenderer(value: string): any[] {
    return [
      {
        or: [
          { displayName: { textContains: value } },
          { emails: { textContains: value } },
        ],
      },
    ];
  },
};
