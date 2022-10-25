import { INITIAL_PAGE_SIZE } from './constants'
import { filtersAreDifferent } from '@/shared/filter/helpers/different-util'

export default () => {
  return {
    rows: (state) =>
      state.list.ids.map((r) => state.records[r]),
    hasRows: (state) => state.count > 0,
    orderBy: (state) => {
      const sorter = state.sorter

      if (!sorter) {
        return null
      }

      if (!sorter.prop) {
        return null
      }

      let direction =
        sorter.order === 'desc' ? 'DESC' : 'ASC'

      return `${sorter.prop}_${direction}`
    },
    find: (state) => (id) => {
      return state.records[id]
    },
    limit: (state) => {
      const pagination = state.pagination

      if (!pagination || !pagination.pageSize) {
        return INITIAL_PAGE_SIZE
      }

      return pagination.pageSize
    },

    offset: (state) => {
      const pagination = state.pagination

      if (!pagination || !pagination.pageSize) {
        return 0
      }

      const currentPage = pagination.currentPage || 1

      return (currentPage - 1) * pagination.pageSize
    },

    pagination: (state) => {
      return {
        ...state.pagination,
        total: state.count,
        showSizeChanger: true
      }
    },

    selectedRows: (state) => {
      return state.list.table
        ? state.list.table.getSelectionRows()
        : []
    },

    activeView: (state) => {
      return state.views.find((v) => v.active)
    },

    showResetView: (state, getters) => {
      return filtersAreDifferent(
        state.filter,
        getters.activeView.filter
      )
    },

    saveLoading: (state) => {
      return state.saveLoading
    }
  }
}
