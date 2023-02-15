import sharedMutations from '@/shared/store/mutations'

export default {
  ...sharedMutations(),
  FETCH_STARTED(state, { keepPagination, activeView }) {
    state.views[activeView].list.loading = true

    if (!keepPagination) {
      state.views[activeView].list.posts.length = 0
    }

    state.pagination = keepPagination
      ? state.pagination
      : {
          currentPage: 1,
          pageSize:
            state.pagination && state.pagination.pageSize
        }
  },

  FETCH_SUCCESS(
    state,
    { list, count, appendToList, activeView }
  ) {
    state.views[activeView].list.loading = false
    if (appendToList) {
      state.views[activeView].list.posts.concat(list)
    } else {
      state.views[activeView].list.posts = list
    }
    state.count = count
  },

  FETCH_ERROR(state, { activeView }) {
    state.views[activeView].list.loading = false
    state.views[activeView].list.posts = []
    state.views[activeView].count = 0
  },

  CREATE_CONTENT_SUCCESS(
    state,
    { post, index, activeView }
  ) {
    state.views[activeView].list.posts[index] = {
      ...post,
      actions:
        state.views[activeView].list.posts[index].actions
    }
  },

  CREATE_ACTION_SUCCESS(
    state,
    { action, index, activeView }
  ) {
    const indexAction = state.views[activeView].list.posts[
      index
    ].actions.findIndex((a) => a.type === action.type)

    if (indexAction === -1) {
      state.views[activeView].list.posts[
        index
      ].actions.push(action)
    } else {
      state.views[activeView].list.posts[index].actions[
        indexAction
      ] = action
    }
  },

  DELETE_ACTION_SUCCESS(
    state,
    { actionType, index, activeView }
  ) {
    // Remove post from bookmarks view
    if (
      actionType === 'bookmark' &&
      activeView === 'bookmarked'
    ) {
      state.views[activeView].list.posts.splice(index, 1)
      // Remove action from post
    } else {
      const deleteIndex = state.views[
        activeView
      ].list.posts[index].actions.findIndex(
        (a) => a.type === actionType
      )

      state.views[activeView].list.posts[
        index
      ].actions.splice(deleteIndex, 1)
    }
  },

  UPDATE_ACTION_ERROR(
    state,
    { index, activeView, actions }
  ) {
    state.views[activeView].list.posts[index].actions =
      actions
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
