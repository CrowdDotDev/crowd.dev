import { FilterConfig } from '@/shared/modules/filters/types/FilterConfig';
import { SearchFilterConfig } from '@/shared/modules/filters/types/filterTypes/SearchFilterConfig';
import activityType from './activityType/config';
import channel from './channel/config';
import date from './date/config';
import member from './member/config';
import platform from './platform/config';
import sentiment from './sentiment/config';

export const activityFilters: Record<string, FilterConfig> = {
  activityType,
  channel,
  date,
  member,
  platform,
  sentiment,
};
export const activitySearchFilter: SearchFilterConfig = {
  placeholder: 'Search activities',
  apiFilterRenderer(value: string): any[] {
    return [
      {
        or: [
          { title: { textContains: value } },
          { body: { textContains: value } },
        ],
      },
    ];
  },
};
