import sharedMutations from '@/shared/store/mutations'

export default {
  ...sharedMutations(),
  PUBLISH_ALL_STARTED(state) {
    state.loading.submit = true
  },

  PUBLISH_ALL_SUCCESS(state, conversationIds) {
    state.loading.submit = false

    for (const conversationId of conversationIds) {
      state.records[conversationId].published = true
    }
  },

  PUBLISH_ALL_ERROR(state) {
    state.loading.submit = false
  },

  UNPUBLISH_ALL_STARTED(state) {
    state.loading.submit = true
  },

  UNPUBLISH_ALL_SUCCESS(state, conversationIds) {
    state.loading.submit = false

    for (const conversationId of conversationIds) {
      state.records[conversationId].published = false
    }
  },

  UNPUBLISH_ALL_ERROR(state) {
    state.loading.submit = false
  },

  OPEN_SETTINGS_MODAL(state) {
    state.settingsVisible = true
  },

  CLOSE_SETTINGS_MODAL(state) {
    state.settingsVisible = false
  }
}
