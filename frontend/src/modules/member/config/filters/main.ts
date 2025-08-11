import { FilterConfig } from '@/shared/modules/filters/types/FilterConfig';
import { SearchFilterConfig } from '@/shared/modules/filters/types/filterTypes/SearchFilterConfig';
import unaffiliated from '@/modules/member/config/filters/unaffiliated/config';
import noOfActivities from './noOfActivities/config';
import noOfOSSContributions from './noOfOSSContributions/config';
import activeOn from './activeOn/config';
import activityType from './activityType/config';
import avgSentiment from './avgSentiment/config';
import engagementLevel from './engagementLevel/config';
import identities from './identities/config';
import joinedDate from './joinedDate/config';
import lastActivityDate from './lastActivityDate/config';
import reach from './reach/config';
import projects from './projects/config';
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
  identities,
  joinedDate,
  lastActivityDate,
  reach,
  projects,
  unaffiliated,
};

export const memberSearchFilter: SearchFilterConfig = {
  placeholder: 'Search people',
  apiFilterRenderer(): any[] {
    return [];
  },
};
