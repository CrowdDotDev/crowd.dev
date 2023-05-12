import { FilterConfig } from '@/shared/modules/filters/types/FilterConfig';
import noOfMembers from './noOfMembers/config';
import noOfActivities from './noOfActivities/config';
import activeOn from './activeOn/config';
import joinedDate from './joinedDate/config';
import lastActivityDate from './lastActivityDate/config';

export const organizationFilters: Record<string, FilterConfig> = {
  noOfActivities,
  noOfMembers,
  activeOn,
  joinedDate,
  lastActivityDate,
};
