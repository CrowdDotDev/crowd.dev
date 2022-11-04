import { INITIAL_PAGE_SIZE } from './constants'
import { filtersAreDifferent } from '@/shared/filter/helpers/different-util'

export default () => {
  return {
    rows: (state) =>
      state.list.ids.map((r) => state.records[r]),
    hasRows: (state) => state.count > 0,
    orderBy: (state, getters) => {
      const sorter = getters.activeView.sorter

      // TODO: For now this will remain hard coded, need to check API
      if (!sorter.prop) {
        return 'createdAt_DESC'
      }

      let direction =
        sorter.order === 'descending' ? 'DESC' : 'ASC'

      return `${sorter.prop}_${direction}`
    },
    find: (state) => (id) => {
      return state.records[id]
    },
    limit: (state, getters) => {
      const pagination = getters.activeView.pagination

      if (!pagination || !pagination.pageSize) {
        return INITIAL_PAGE_SIZE
      }

      return pagination.pageSize
    },

    offset: (state, getters) => {
      const pagination = getters.activeView.pagination

      if (!pagination || !pagination.pageSize) {
        return 0
      }

      const currentPage = pagination.currentPage || 1

      return (currentPage - 1) * pagination.pageSize
    },

    pagination: (state, getters) => {
      return {
        ...getters.activeView.pagination,
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
      return state.views
        ? Object.values(state.views).find((v) => v.active)
        : {
            pagination: {},
            sorter: {}
          }
    },

    showResetView: (state, getters) => {
      return filtersAreDifferent(
        getters.activeView.filter,
        getters.activeView.initialFilter
      )
    },

    saveLoading: (state) => {
      return state.saveLoading
    }
  }
}
