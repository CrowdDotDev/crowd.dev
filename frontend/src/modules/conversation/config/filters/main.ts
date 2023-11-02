import { FilterConfig } from '@/shared/modules/filters/types/FilterConfig';
import { SearchFilterConfig } from '@/shared/modules/filters/types/filterTypes/SearchFilterConfig';
import { trimAndReduceSpaces } from '@/utils/string';
import noOfActivities from './noOfActivities/config';
import channel from './channel/config';
import dateStarted from './dateStarted/config';
import lastActivityDate from './lastActivityDate/config';
import platform from './platform/config';

export const conversationFilters: Record<string, FilterConfig> = {
  noOfActivities,
  channel,
  dateStarted,
  lastActivityDate,
  platform,
};
export const conversationSearchFilter: SearchFilterConfig = {
  placeholder: 'Search conversations',
  apiFilterRenderer(value: string): any[] {
    return [
      {
        or: [
          { title: { textContains: trimAndReduceSpaces(value) } },
        ],
      },
    ];
  },
};
