import { Filter } from '@/shared/modules/filters/types/FilterConfig';

export interface ActivityState {
  filters: Filter,
  savedFilterBody: any,
  activities: [],
  totalActivities: number
  pagination: {
    page: number,
    perPage: number
  }
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
} as ActivityState);
