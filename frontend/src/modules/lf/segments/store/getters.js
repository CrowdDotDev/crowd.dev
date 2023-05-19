export default {
  offset: (state) => {
    const currentPage = state.projectGroups.pagination.currentPage || 1;

    return (currentPage - 1) * state.projectGroups.pagination.pageSize;
  },
};
