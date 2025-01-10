export default () => ({
  records: {},
  list: {
    ids: [],
    loading: false,
  },
  saveLoading: false,
  count: 0,
  pagination: {
    currentPage: 1,
    pageSize: 20,
  },
  sorter: {
    prop: 'createdAt',
    order: 'descending',
  },
});
