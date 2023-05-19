export default () => ({
  projectGroups: {
    list: [],
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
    pagination: {
      pageSize: 20,
      currentPage: 1,
      total: 0,
      count: 0,
    },
  },
  searchProjectGroups: '',
  searchProjects: '',
});
