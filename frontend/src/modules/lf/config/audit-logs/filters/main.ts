import { FilterConfig } from '@/shared/modules/filters/types/FilterConfig';
import { SearchFilterConfig } from '@/shared/modules/filters/types/filterTypes/SearchFilterConfig';
import { trimAndReduceSpaces } from '@/utils/string';
import entityType from './entityType/config';
import action from './action/config';
import actionDate from './actionDate/config';
import user from './user/config';
import status from './status/config';

export const auditLogsFilters: Record<string, FilterConfig> = {
  entityType,
  action,
  actionDate,
  user,
  status,
};

export const auditLogsSearchFilter: SearchFilterConfig = {
  placeholder: 'Search logs...',
  apiFilterRenderer(value: string): any[] {
    const trimmedValue = trimAndReduceSpaces(value);
    return [
      {
        or: [
          { name: { textContains: trimmedValue } },
        ],
      },
    ];
  },
};
