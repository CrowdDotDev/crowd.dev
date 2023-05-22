import { Filter, FilterConfig } from '@/shared/modules/filters/types/FilterConfig';

export interface MemberState {
  filters: Filter,
  customAttributes: Record<string, FilterConfig>
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
  customAttributes: {},
} as MemberState);
