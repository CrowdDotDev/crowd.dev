export default () => ({
  selectedProjectGroup: null,
  projectGroups: {
    list: [],
    loading: true,
    pagination: {
      pageSize: 20,
      currentPage: 1,
      total: 0,
      count: 0,
    },
  },
  projects: {
    list: [],
    parentSlug: '',
    loading: true,
    pagination: {
      pageSize: 20,
      currentPage: 1,
      total: 0,
      count: 0,
    },
  },
});
