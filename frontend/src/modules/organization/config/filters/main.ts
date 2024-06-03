import { FilterConfig } from '@/shared/modules/filters/types/FilterConfig';
import { SearchFilterConfig } from '@/shared/modules/filters/types/filterTypes/SearchFilterConfig';
import { trimAndReduceSpaces } from '@/utils/string';
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
import projects from './projects/config';
import annualRevenue from './annualRevenue/config';
import annualEmployeeChurnRate from './annualEmployeeChurnRate/config';
import annualEmployeeGrowthRate from './annualEmployeeGrowthRate/config';
import employeeCount from './employeeCount/config';
import tags from './tags/config';
import type from './type/config';
import organizations from './organizations/config';

export const organizationFilters: Record<string, FilterConfig> = {
  organizations,
  noOfActivities,
  noOfMembers,
  activeOn,
  annualEmployeeChurnRate,
  annualEmployeeGrowthRate,
  annualRevenue,
  employeeCount,
  enrichedOrganization,
  founded,
  headcount,
  headline,
  industry,
  joinedDate,
  lastActivityDate,
  location,
  projects,
  tags,
  type,
};

export const organizationSearchFilter: SearchFilterConfig = {
  placeholder: 'Search organizations',
  apiFilterRenderer(value: string): any[] {
    return [
      {
        or: [
          { displayName: { textContains: trimAndReduceSpaces(value) } },
        ],
      },
    ];
  },
};
