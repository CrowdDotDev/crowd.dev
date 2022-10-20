import { INITIAL_PAGE_SIZE } from './constants'
import { filtersAreDifferent } from '@/shared/filter/is-different'

export default {
  rows: (state, getters) =>
    state.list.ids.map((id) => {
      return getters.activeView.type === 'conversations'
        ? state.records.conversations[id]
        : state.records.activities[id]
    }),
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
      sorter.order === 'descending' ? 'DESC' : 'ASC'

    return `${sorter.prop}_${direction}`
  },
  find: (state, getters) => (id) => {
    return getters.activeView.type === 'conversations'
      ? state.records.conversation[id]
      : state.records.activities[id]
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

  activeView: (state) => {
    return state.views.find((v) => v.active)
  },

  showResetView: (state, getters) => {
    return filtersAreDifferent(
      state.filter,
      getters.activeView.filter
    )
  }
}
