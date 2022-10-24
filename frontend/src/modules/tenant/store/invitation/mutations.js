export default {
  ACCEPT_FROM_AUTH_STARTED(state) {
    state.warningMessage = null
    state.loading = true
  },

  ACCEPT_FROM_AUTH_SUCCESS(state) {
    state.warningMessage = null
    state.loading = false
  },

  ACCEPT_FROM_AUTH_WARNING(state, payload) {
    state.warningMessage = payload
    state.loading = false
  },

  ACCEPT_FROM_AUTH_ERROR(state) {
    state.warningMessage = null
    state.loading = false
  },

  ACCEPT_STARTED(state) {
    state.loading = true
  },

  ACCEPT_SUCCESS(state) {
    state.loading = false
  },

  ACCEPT_ERROR(state) {
    state.loading = false
  },

  DECLINE_STARTED(state) {
    state.loading = true
  },

  DECLINE_SUCCESS(state) {
    state.loading = false
  },

  DECLINE_ERROR(state) {
    state.loading = false
  }
}
