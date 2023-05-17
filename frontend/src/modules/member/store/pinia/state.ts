import { Filter } from '@/shared/modules/filters/types/FilterConfig';

interface MemberState {
  filters: Filter
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
      prop: 'createdBy',
      order: 'descending',
    },
  } as Filter,
} as MemberState);
