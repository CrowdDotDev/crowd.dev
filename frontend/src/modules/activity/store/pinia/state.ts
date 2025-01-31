import { Filter } from '@/shared/modules/filters/types/FilterConfig';
import dayjs from 'dayjs';

export interface ActivityState {
  filters: Filter,
  savedFilterBody: any,
  activities: any[],
  totalActivities: number,
  limit: number,
  timestamp: string,
  activityChannels: Record<string, string[]>,
}

export default () => ({
  filters: {
    search: '',
    relation: 'and',
    order: {
      prop: 'timestamp',
      order: 'descending',
    },
  } as Filter,
  limit: 20,
  timestamp: dayjs().toISOString(),
  savedFilterBody: {},
  activities: [],
  totalActivities: 0,
  activityChannels: {},
} as ActivityState);
