import { INITIAL_PAGE_SIZE } from './constants'

export default {
  RESETED(state) {
    state.list.ids = []
    state.list.loading = false
    state.count = 0
    state.filter = {}
    state.pagination = {}
    state.sorter = {
      prop: 'score',
      order: 'descending'
    }

    if (state.list.table) {
      state.list.table.clearSelection()
    }
  },

  UNSELECT_ALL(state) {
    if (state.list.table) {
      state.list.table.clearSelection()
    }
  },

  TABLE_MOUNTED(state, payload) {
    state.list.table = payload
  },

  PAGINATION_CHANGED(state, payload) {
    state.pagination = payload || {}
  },

  PAGINATION_CURRENT_PAGE_CHANGED(state, payload) {
    const previousPagination = state.pagination || {}

    state.pagination = {
      currentPage: payload || 1,
      pageSize:
        previousPagination.pageSize || INITIAL_PAGE_SIZE
    }
  },

  PAGINATION_PAGE_SIZE_CHANGED(state, payload) {
    const previousPagination = state.pagination || {}

    state.pagination = {
      currentPage: previousPagination.currentPage || 1,
      pageSize: payload || INITIAL_PAGE_SIZE
    }
  },

  SORTER_CHANGED(state, payload) {
    state.sorter =
      Object.keys(payload).length > 0
        ? payload
        : {
            prop: 'score',
            order: 'descending'
          }
  },

  ACTIVE_VIEW_CHANGED(state, viewId) {
    state.views = Object.values(state.views).reduce(
      (acc, item) => {
        acc.push({
          ...item,
          active: item.id === viewId
        })
        return acc
      },
      []
    )
  },

  FETCH_STARTED(state, payload) {
    state.list.loading = true

    if (state.table) {
      state.list.table.clearSelection()
    }
    state.pagination =
      payload && payload.keepPagination
        ? state.pagination
        : {
            pageSize:
              state.pagination && state.pagination.pageSize
          }
  },

  FETCH_SUCCESS(state, payload) {
    state.list.loading = false
    for (const record of payload.rows) {
      state.records[record.id] = record
    }
    state.list.ids = payload.rows.map((r) => r.id)
    state.count = payload.count
  },

  FETCH_ERROR(state) {
    state.list.loading = false
    state.list.ids = []
    state.count = 0
  },

  DESTROY_CUSTOM_ATTRIBUTES_STARTED() {},
  DESTROY_CUSTOM_ATTRIBUTES_SUCCESS() {},
  DESTROY_CUSTOM_ATTRIBUTES_ERROR() {},

  FETCH_CUSTOM_ATTRIBUTES_STARTED() {},

  FETCH_CUSTOM_ATTRIBUTES_SUCCESS(state, payload) {
    state.customAttributes = payload.rows.reduce(
      (acc, item) => {
        acc[item.name] = item
        return acc
      },
      {}
    )
  },

  FETCH_CUSTOM_ATTRIBUTES_ERROR(state) {
    state.customAttributes = {}
  },

  EXPORT_STARTED(state) {
    state.exportLoading = true
  },

  EXPORT_SUCCESS(state) {
    state.exportLoading = false
  },

  EXPORT_ERROR(state) {
    state.exportLoading = false
  },

  MERGE_STARTED(state) {
    state.mergeLoading = true
  },

  MERGE_SUCCESS(state) {
    state.mergeLoading = false
  },

  MERGE_ERROR(state) {
    state.mergeLoading = false
  },

  BULK_UPDATE_MEMBERS_TAGS_STARTED(state) {
    state.list.loading = true
  },

  BULK_UPDATE_MEMBERS_TAGS_SUCCESS(state, members) {
    for (const member of members) {
      const index = state.list.ids.findIndex(
        (r) => r.id === member.id
      )
      state.list.ids[index] = member
    }
    state.list.loading = false
  },

  BULK_UPDATE_MEMBERS_TAGS_ERROR(state) {
    state.list.loading = false
  },

  CREATE_STARTED() {},
  CREATE_SUCCESS() {},
  CREATE_ERROR() {},

  CREATE_ATTRIBUTES_STARTED() {},
  CREATE_ATTRIBUTES_SUCCESS() {},
  CREATE_ATTRIBUTES_ERROR() {},

  UPDATE_STARTED() {},
  UPDATE_SUCCESS() {},
  UPDATE_ERROR() {},

  DESTROY_ALL_STARTED() {},
  DESTROY_ALL_SUCCESS() {},
  DESTROY_ALL_ERROR() {},

  DESTROY_STARTED() {},
  DESTROY_SUCCESS() {},
  DESTROY_ERROR() {},

  FIND_STARTED() {},
  FIND_SUCCESS() {},
  FIND_ERROR() {},

  FILTER_CHANGED(state, filter) {
    const { attributes, operator } = filter
    state.filter = {
      attributes: { ...attributes } || {},
      operator: operator || 'and'
    }
  },

  FILTER_ATTRIBUTE_ADDED(state, attribute) {
    state.filter.attributes[attribute.name] = attribute
  },

  FILTER_ATTRIBUTE_CHANGED(state, attribute) {
    state.filter.attributes[attribute.name] = attribute
  },

  FILTER_ATTRIBUTE_DESTROYED(state, attribute) {
    delete state.filter.attributes[attribute.name]
  },

  FILTER_OPERATOR_UPDATED(state, operator) {
    state.filter.operator = operator
  }
}
