import { Filter } from '@/shared/modules/filters/types/FilterConfig';

export interface ActivityState {
  filters: Filter,
  savedFilterBody: any,
  activities: any[],
  totalActivities: number
  pagination: {
    page: number,
    perPage: number
  }
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
  pagination: {
    page: 1,
    perPage: 20,
  },
  savedFilterBody: {},
  activities: [],
  totalActivities: 0,
  activityChannels: {},
} as ActivityState);
