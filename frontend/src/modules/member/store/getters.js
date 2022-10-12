import { INITIAL_PAGE_SIZE } from './constants'

export default {
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
      sorter.order === 'descending' ? 'DESC' : 'ASC'

    return `${sorter.prop}_${direction}`
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
  }
}

const filtersAreDifferent = (filter, viewFilter) => {
  if (
    Object.keys(filter).length !==
    Object.keys(viewFilter).length
  ) {
    // Objects are not fully built yet, no need to compare
    return false
  } else if (
    Object.keys(filter.attributes).length !==
    Object.keys(viewFilter.attributes).length
  ) {
    return true
  } else if (filter.operator !== viewFilter.operator) {
    return true
  } else {
    return Object.values(filter.attributes).some(
      (attribute) => {
        return attributeIsDifferent(attribute)
      }
    )
  }
}

const attributeIsDifferent = (attribute) => {
  return (
    attribute.operator !== attribute.defaultOperator ||
    attribute.value !== attribute.defaultValue
  )
}
