import { SegmentsState } from './state';

export default {
  offset: (state: SegmentsState) => {
    const currentPage = state.projectGroups.pagination.currentPage || 1;

    return (currentPage - 1) * state.projectGroups.pagination.pageSize;
  },
};
