import sharedMutations from '@/shared/store/mutations';

export default {
  ...sharedMutations(),
  FETCH_STARTED(state, { keepPagination, activeView }) {
    state.views[activeView].list.loading = true;

    if (!keepPagination) {
      state.views[activeView].list.posts.length = 0;
    }

    if (activeView.pagination) {
      const active = { ...activeView };

      active.pagination = keepPagination
        ? active.pagination
        : {
          currentPage: 1,
          pageSize: active.pagination?.pageSize || 10,
        };
    }
  },

  FETCH_SUCCESS(
    state,
    {
      list, count, appendToList, activeView,
    },
  ) {
    state.views[activeView].list.loading = false;

    if (appendToList) {
      state.views[activeView].list.posts.push(...list);
    } else {
      const { sorter } = state.views[activeView];

      if (activeView === 'feed' && sorter === 'recent') {
        list.sort(
          (a, b) => new Date(b.postedAt) - new Date(a.postedAt),
        );
      }

      state.views[activeView].list.posts = list;
    }
    state.views[activeView].count = count;
  },

  FETCH_ERROR(state, { activeView }) {
    state.views[activeView].list.loading = false;
    state.views[activeView].list.posts = [];
    state.views[activeView].count = 0;
  },

  CREATE_ACTION_SUCCESS(
    state,
    {
      post, action, index, activeView,
    },
  ) {
    // Update feed post if bookmark action is updated
    if (activeView === 'bookmarked') {
      const feedPost = state.views.feed.list.posts.find(
        (p) => p.url === post.url,
      );

      if (feedPost) {
        const indexAction = feedPost.actions.findIndex(
          (a) => a.type === action.type,
        );

        if (indexAction === -1) {
          feedPost.actions.push(action);
        } else {
          feedPost.actions[indexAction] = {
            ...action,
            id: action.id,
          };
        }
      }
    }

    const { actions } = state.views[activeView].list.posts[index];
    const indexAction = actions.findIndex(
      (a) => a.type === action.type,
    );

    // Update store post with new one, except for actions
    state.views[activeView].list.posts[index] = {
      ...post,
      actions,
    };

    if (indexAction === -1) {
      actions.push(action);
    } else {
      actions[indexAction] = {
        ...action,
        id: action.id,
      };
    }
  },

  REMOVE_ACTION_SUCCESS(
    state,
    {
      postId, action, index, activeView,
    },
  ) {
    // Update feed post if bookmark action is updated
    if (activeView === 'bookmarked') {
      const feedPost = state.views.feed.list.posts.find(
        (p) => p.id === postId,
      );

      if (feedPost) {
        const deleteIndex = feedPost.actions.findIndex(
          (a) => a.type === action.type,
        );

        if (deleteIndex !== -1) {
          feedPost.actions.splice(deleteIndex, 1);
        }
      }
    }

    // Remove post from bookmarks view
    if (
      action.type === 'bookmark'
      && activeView === 'bookmarked'
    ) {
      state.views[activeView].list.posts.splice(index, 1);
    } else {
      // Remove action from post
      const { actions } = state.views[activeView].list.posts[index];
      const deleteIndex = actions.findIndex(
        (a) => a.type === action.type,
      );

      if (deleteIndex !== -1) {
        actions.splice(deleteIndex, 1);
      }
    }
  },

  CREATE_TEMPORARY_ACTION(
    state,
    { action, activeView, index },
  ) {
    const { actions } = state.views[activeView].list.posts[index];
    const indexAction = actions.findIndex(
      (a) => a.type === action.type,
    );

    if (indexAction === -1) {
      actions.push(action);
    } else {
      actions[indexAction] = action;
    }
  },

  REMOVE_TEMPORARY_ACTION(
    state,
    { action, activeView, index },
  ) {
    const { actions } = state.views[activeView].list.posts[index];
    const deleteIndex = actions.findIndex(
      (a) => a.type === action.type,
    );

    actions[deleteIndex].toRemove = true;
  },

  UPDATE_POST(state, { activeView, index, post }) {
    state.views[activeView].list.posts[index] = post;
  },

  SORTER_CHANGED(state, payload) {
    const { activeView, sorter } = payload;
    state.views[activeView.id].sorter = sorter;
  },

  UPDATE_EAGLE_EYE_SETTINGS_STARTED(state) {
    state.loadingUpdateSettings = true;
  },

  UPDATE_EAGLE_EYE_SETTINGS_SUCCESS(state) {
    state.loadingUpdateSettings = false;
  },

  UPDATE_EAGLE_EYE_SETTINGS_ERROR(state) {
    state.loadingUpdateSettings = false;
  },

  ADD_PENDING_ACTION(state, job) {
    state.pendingActions.push(job);
  },

  SET_ACTIVE_ACTION(state, job) {
    state.activeAction = job;
  },

  POP_CURRENT_ACTION(state) {
    state.pendingActions.shift();
  },
};
