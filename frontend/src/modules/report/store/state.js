import { INITIAL_PAGE_SIZE } from './constants';

export default () => ({
  records: {},
  list: {
    ids: [],
    loading: false,
    table: false,
  },
  count: 0,
  pagination: {
    currentPage: 1,
    pageSize: INITIAL_PAGE_SIZE,
  },
  sorter: {
    prop: 'createdAt',
    order: 'descending',
  },
});
