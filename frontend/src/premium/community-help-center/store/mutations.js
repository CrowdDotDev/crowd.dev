import sharedMutations from '@/shared/store/mutations';

export default {
  ...sharedMutations(),
  PUBLISH_ALL_STARTED() {},

  PUBLISH_ALL_SUCCESS(state, conversationIds) {
    conversationIds.forEach((conversationId) => {
      state.records[conversationId].published = true;
    });
  },

  PUBLISH_ALL_ERROR() {},

  UNPUBLISH_ALL_STARTED() {},

  UNPUBLISH_ALL_SUCCESS(state, conversationIds) {
    conversationIds.forEach((conversationId) => {
      state.records[conversationId].published = false;
    });
  },

  UNPUBLISH_ALL_ERROR() {},

  OPEN_SETTINGS_DRAWER(state) {
    state.settingsVisible = true;
  },

  CLOSE_SETTINGS_DRAWER(state) {
    state.settingsVisible = false;
  },
};
