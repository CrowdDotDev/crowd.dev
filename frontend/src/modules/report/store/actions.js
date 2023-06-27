import sharedActions from '@/shared/store/actions';
import { ReportService } from '@/modules/report/report-service';
import Errors from '@/shared/error/errors';

export default {
  ...sharedActions('report', ReportService),
  async doFetch(
    { commit, getters },
    { keepPagination = false },
  ) {
    try {
      commit('FETCH_STARTED', { keepPagination });

      const response = await ReportService.list(
        {},
        getters.orderBy,
        getters.limit,
        getters.offset,
      );

      commit('FETCH_SUCCESS', {
        rows: response.rows,
        count: response.count,
      });
    } catch (error) {
      Errors.handle(error);
      commit('FETCH_ERROR');
    }
  },
  doChangePagination({ commit, dispatch }, pagination) {
    commit('PAGINATION_CHANGED', pagination);
    dispatch('doFetch', {
      keepPagination: true,
    });
  },

  doChangePaginationPageSize(
    { commit, dispatch },
    pageSize,
  ) {
    commit('PAGINATION_PAGE_SIZE_CHANGED', pageSize);
    dispatch('doFetch', {
      keepPagination: true,
    });
  },

  doChangePaginationCurrentPage(
    { commit, dispatch },
    currentPage,
  ) {
    commit('PAGINATION_CURRENT_PAGE_CHANGED', currentPage);
    dispatch('doFetch', {
      keepPagination: true,
    });
  },

  doChangeSort({ commit, dispatch }, sorter) {
    commit('SORTER_CHANGED', sorter);
    dispatch('doFetch', {
      keepPagination: true,
    });
  },
  async doFindPublic({ commit }, {
    id, tenantId, segments, excludeSegments,
  }) {
    try {
      commit('FIND_STARTED', id);
      const record = await ReportService.findPublic(
        id,
        tenantId,
        segments,
        excludeSegments,
      );
      commit('FIND_SUCCESS', record);
    } catch (error) {
      Errors.handle(error);
      commit('FIND_ERROR', id);
    }
  },
};
