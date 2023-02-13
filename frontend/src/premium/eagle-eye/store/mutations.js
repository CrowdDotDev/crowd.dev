import sharedMutations from '@/shared/store/mutations'

export default {
  ...sharedMutations(),
  FETCH_STARTED(state, payload) {
    state.list.loading = true

    if (state.table) {
      state.list.table.clearSelection()
    }

    if (!payload.keepPagination) {
      state.list.posts.length = 0
    }

    state.pagination =
      payload && payload.keepPagination
        ? state.pagination
        : {
            currentPage: 1,
            pageSize:
              state.pagination && state.pagination.pageSize
          }
  },

  FETCH_SUCCESS(state, { list, count, appendToList }) {
    state.list.loading = false
    if (appendToList) {
      state.list.posts.concat(list)
    } else {
      state.list.posts = list
    }
    state.count = count
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
    { actionId, actionType, index, activeView }
  ) {
    state.list.posts[index].loading = false

    // Remove post from bookmarks view
    if (
      actionType === 'bookmark' &&
      activeView === 'bookmarked'
    ) {
      state.list.posts.splice(index, 1)
      // Remove action from post
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
