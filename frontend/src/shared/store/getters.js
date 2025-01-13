import { filtersAreDifferent } from '@/shared/helpers/different-util';
import { INITIAL_PAGE_SIZE } from './constants';

export default () => ({
  rows: (state) => state.list.ids.map((r) => state.records[r]),
  hasRows: (state) => state.count > 0,
  orderBy: (state, getters) => {
    const sorter = state.views
      ? getters.activeView.sorter
      : state.sorter;

    // TODO: For now this will remain hard coded, need to check API
    if (!sorter.prop) {
      return 'createdAt_DESC';
    }

    const direction = sorter.order === 'descending' ? 'DESC' : 'ASC';

    return `${sorter.prop}_${direction}`;
  },
  find: (state) => (id) => state.records[id],
  limit: (state, getters) => {
    const pagination = state.views
      ? getters.activeView.pagination
      : state.pagination;

    if (!pagination || !pagination.pageSize) {
      return INITIAL_PAGE_SIZE;
    }

    return pagination.pageSize;
  },

  offset: (state, getters) => {
    const pagination = state.views
      ? getters.activeView.pagination
      : state.pagination;

    if (!pagination || !pagination.pageSize) {
      return 0;
    }

    const currentPage = pagination.currentPage || 1;

    return (currentPage - 1) * pagination.pageSize;
  },

  pagination: (state, getters) => {
    const pagination = state.views
      ? getters.activeView.pagination
      : state.pagination;
    return {
      ...pagination,
      total: state.count,
      showSizeChanger: true,
    };
  },

  selectedRows: (state) => (state.list.table
    ? state.list.table.getSelectionRows()
    : []),

  activeView: (state) => (state.views
    ? Object.values(state.views).find((v) => v.active)
    : {
      pagination: {},
      sorter: {},
    }),

  showResetView: (state, getters) => filtersAreDifferent(
    getters.activeView.filter,
    getters.activeView.initialFilter,
  ),

  saveLoading: (state) => state.saveLoading,
});
