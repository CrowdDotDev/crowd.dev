import sharedGetters from '@/shared/store/getters';
import { INITIAL_PAGE_SIZE } from './constants';

export default {
  ...sharedGetters(),

  activeViewList: (state) => {
    const activeView = sharedGetters().activeView(state);

    return state.views[activeView.id].list;
  },

  pagination: (state, getters) => ({
    ...getters.activeView.pagination,
    total: getters.activeView.count,
    showSizeChanger: true,
  }),

  limit: (state, getters) => {
    const { pagination } = getters.activeView;

    if (!pagination?.pageSize) {
      return INITIAL_PAGE_SIZE;
    }

    return pagination.pageSize;
  },

  offset: (state, getters) => {
    const { pagination } = getters.activeView;

    if (!pagination?.pageSize) {
      return 0;
    }

    const { currentPage = 1 } = pagination;

    return (currentPage - 1) * pagination.pageSize;
  },
};
