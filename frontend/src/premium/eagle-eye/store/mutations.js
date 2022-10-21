import sharedMutations from '@/shared/store/mutations'

export default {
  ...sharedMutations(),
  POPULATE_STARTED(state) {
    state.list.loading = true
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
  REVERT_EXCLUDE_ERROR() {}
}
