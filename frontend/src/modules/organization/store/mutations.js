export default {
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
