import sharedMutations from '@/shared/store/mutations'

export default {
  ...sharedMutations(),
  FETCH_STARTED(state) {
    state.list.loading = true
  },

  FETCH_SUCCESS(state, { list }) {
    state.list.loading = false
    state.list.posts = list
    state.count = list.length
  },

  UPDATE_ACTION_LOADING(state, { index }) {
    state.list.posts[index].loading = true
  },

  CREATE_CONTENT_SUCCESS(state, { post, index }) {
    state.list.posts[index] = {
      ...state.list.posts[index],
      ...post
    }
  },

  CREATE_ACTION_SUCCESS(state, { action, index }) {
    state.list.posts[index].loading = false
    state.list.posts[index].actions.push(action)
  },

  DELETE_ACTION_SUCCESS(
    state,
    { actionId, actionType, index }
  ) {
    state.list.posts[index].loading = false

    if (actionType === 'bookmark') {
      state.list.posts.splice(index, 1)
    } else {
      const deleteIndex = state.list.posts[
        index
      ].actions.findIndex((a) => a.id === actionId)
      state.list.posts[index].actions.splice(deleteIndex, 1)
    }
  },

  UPDATE_ACTION_ERROR(state, { index }) {
    state.list.posts[index].loading = false
  },

  SORTER_CHANGED(state, payload) {
    const { activeView, sorter } = payload
    state.views[activeView.id].sorter = sorter
  },

  UPDATE_EAGLE_EYE_SETTINGS_STARTED(state) {
    state.loadingUpdateSettings = true
  },

  UPDATE_EAGLE_EYE_SETTINGS_SUCCESS(state) {
    state.loadingUpdateSettings = false
  },

  UPDATE_EAGLE_EYE_SETTINGS_ERROR(state) {
    state.loadingUpdateSettings = false
  }
}
