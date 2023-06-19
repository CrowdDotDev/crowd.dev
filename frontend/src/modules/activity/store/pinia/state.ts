import { Filter } from '@/shared/modules/filters/types/FilterConfig';

export interface ActivityState {
  filters: Filter,
  savedFilterBody: any,
  activities: [],
  totalActivities: number
}

export default () => ({
  filters: {
    search: '',
    relation: 'and',
    pagination: {
      page: 1,
      perPage: 20,
    },
    order: {
      prop: 'timestamp',
      order: 'descending',
    },
  } as Filter,
  savedFilterBody: {},
  activities: [],
  totalActivities: 0,
} as ActivityState);
