import { INITIAL_PAGE_SIZE } from './index'

export default {
  RESETED(state) {
    state.list.ids = []
    state.list.loading = false
    state.count = 0
    state.filter = { type: state.filter.type }
    state.rawFilter = { type: state.rawFilter.type }
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
    state.sorter = payload || {}
  },

  FETCH_STARTED(state, payload) {
    state.list.loading = true

    if (state.table) {
      state.list.table.clearSelection()
    }

    state.rawFilter =
      payload && state.rawFilter ? state.rawFilter : {}
    state.filter =
      payload && payload.filter ? payload.filter : {}
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
    state.list.ids = payload.rows
    state.count = payload.count
  },

  FETCH_ERROR(state) {
    state.list.loading = false
    state.list.ids = []
    state.count = 0
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
  FIND_ERROR() {}
}
