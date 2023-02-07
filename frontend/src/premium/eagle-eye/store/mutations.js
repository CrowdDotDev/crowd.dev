import sharedMutations from '@/shared/store/mutations'

export default {
  ...sharedMutations(),
  FETCH_SUCCESS(state, { rows, count }) {
    state.list.loading = false

    for (const record of rows) {
      state.records[record.id] = record
      if (!state.list.ids.includes(record.id)) {
        state.list.ids.push(record.id)
      }
    }

    state.count = count
  },

  POPULATE_STARTED(state, { keepPagination }) {
    state.list.loading = true

    if (!keepPagination) {
      state.list.ids.length = 0
    }
  },

  POPULATE_SUCCESS(state) {
    state.list.loading = true
  },

  POPULATE_ERROR(state) {
    state.list.loading = false
  },

  ENGAGE_STARTED() {},

  ENGAGE_SUCCESS(state, recordId) {
    if (state.records[recordId].status !== 'engaged') {
      state.count--
    }
    state.records[recordId].status = 'engaged'
  },
  ENGAGE_ERROR() {},

  EXCLUDE_STARTED() {},

  EXCLUDE_SUCCESS(state, recordId) {
    state.records[recordId].status = 'rejected'
    state.count--
  },
  EXCLUDE_ERROR() {},

  REVERT_EXCLUDE_STARTED() {},

  REVERT_EXCLUDE_SUCCESS(state, recordId) {
    state.records[recordId].status = null
    state.count--
  },
  REVERT_EXCLUDE_ERROR() {},

  UPDATE_EAGLE_EYE_SETTINGS_STARTED() {},
  UPDATE_EAGLE_EYE_SETTINGS_SUCCESS() {},
  UPDATE_EAGLE_EYE_SETTINGS_ERROR() {}
}
