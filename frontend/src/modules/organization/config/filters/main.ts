import { FilterConfig } from '@/shared/modules/filters/types/FilterConfig';
import { SearchFilterConfig } from '@/shared/modules/filters/types/filterTypes/SearchFilterConfig';
import noOfMembers from './noOfMembers/config';
import noOfActivities from './noOfActivities/config';
import activeOn from './activeOn/config';
import enrichedOrganization from './enrichedOrganization/config';
import founded from './founded/config';
import headcount from './headcount/config';
import headline from './headline/config';
import industry from './industry/config';
import joinedDate from './joinedDate/config';
import lastActivityDate from './lastActivityDate/config';
import location from './location/config';
import type from './type/config';

export const organizationFilters: Record<string, FilterConfig> = {
  noOfActivities,
  noOfMembers,
  activeOn,
  enrichedOrganization,
  founded,
  headcount,
  headline,
  industry,
  joinedDate,
  lastActivityDate,
  location,
  type,
};

export const organizationSearchFilter: SearchFilterConfig = {
  placeholder: 'Search organizations',
  apiFilterRenderer(value: string): any[] {
    return [
      {
        or: [
          { name: { textContains: value } },
        ],
      },
    ];
  },
};
