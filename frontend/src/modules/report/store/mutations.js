import sharedMutations from '@/shared/store/mutations';
import { INITIAL_PAGE_SIZE } from '@/shared/store/constants';

export default {
  ...sharedMutations(),
  PAGINATION_CHANGED(state, pagination) {
    state.pagination = pagination || {};
  },

  PAGINATION_CURRENT_PAGE_CHANGED(state, currentPage) {
    const previousPagination = state.pagination || {};

    state.pagination = {
      currentPage: currentPage || 1,
      pageSize:
        previousPagination.pageSize || INITIAL_PAGE_SIZE,
    };
  },

  PAGINATION_PAGE_SIZE_CHANGED(state, pageSize) {
    const previousPagination = state.pagination || {};

    state.pagination = {
      currentPage: previousPagination.currentPage || 1,
      pageSize: pageSize || INITIAL_PAGE_SIZE,
    };
  },

  SORTER_CHANGED(state, sorter) {
    state.sorter = Object.keys(sorter).length > 0
      ? sorter
      : {
        prop: 'createdAt',
        order: 'descending',
      };
  },
};
