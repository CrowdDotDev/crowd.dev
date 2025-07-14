import sharedActions from '@/shared/store/actions';
import { EagleEyeService } from '@/modules/eagle-eye/eagle-eye-service';
import Errors from '@/shared/error/errors';
import {
  getResultsFromStorage,
  setResultsInStorage,
  shouldFetchNewResults,
  isStorageUpdating,
} from '@/modules/eagle-eye/eagle-eye-storage';

import { MessageStore } from '@/shared/message/notification';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';
import { dateHelper } from '@/shared/date-helper/date-helper';

export default {
  ...sharedActions('eagleEye'),
  async doFetch(
    {
      state, commit, getters, rootGetters,
    },
    { keepPagination = false, resetStorage = false },
  ) {
    const authStore = useAuthStore();
    const { user, tenant } = storeToRefs(authStore);
    const activeView = getters.activeView.id;
    let list = [];
    let count = 0;
    let appendToList = false;

    // Edge case where new results were fetched but user changed tabs
    // This is to prevent a new fetch until the previous results were loaded
    if (
      activeView === 'feed'
      && state.views[activeView].list.loading
      && isStorageUpdating({
        tenantId: tenant.value.id,
        userId: user.value.id,
      })
    ) {
      return;
    }

    try {
      commit('FETCH_STARTED', {
        keepPagination: resetStorage
          ? false
          : keepPagination,
        activeView,
      });

      // Bookmarks View
      if (activeView === 'bookmarked') {
        const { sorter } = getters.activeView;
        const response = await EagleEyeService.query(
          {
            action: {
              type: 'bookmark',
              ...(sorter === 'individualBookmarks' && {
                actionById: user.value.id,
              }),
            },
          },
          getters.orderBy,
          getters.limit,
          getters.offset,
        );

        list = response.rows;
        count = response.count;

        // Append to existing list if offset is not 0
        // User clicked on load more button
        if (getters.offset !== 0) {
          appendToList = true;
        }
      } else {
        // Fetch for new results when
        // resetStorage = true (settings were updated)
        // or criteria to fetch new results = true (new day)
        // or storage is waiting for results
        const fetchNewResults = resetStorage
          || shouldFetchNewResults({
            tenantId: tenant.value.id,
            userId: user.value.id,
          })
          || isStorageUpdating({
            tenantId: tenant.value.id,
            userId: user.value.id,
          });

        if (fetchNewResults) {
          // Set storage to be in updating state
          setResultsInStorage({
            posts: [],
            storageDate: null,
            tenantId: tenant.value.id,
            userId: user.value.id,
          });

          list = await EagleEyeService.search();

          // Set new results in local storage
          setResultsInStorage({
            posts: list,
            storageDate: dateHelper(),
            tenantId: tenant.value.id,
            userId: user.value.id,
          });
        } else {
          // Get results from local storage
          list = getResultsFromStorage({
            tenantId: tenant.value.id,
            userId: user.value.id,
          });
        }
      }

      // Only update view list results if active view is the same from the initial request
      // This is to prevent the user changing between tabs and the request was still loading
      commit('FETCH_SUCCESS', {
        list,
        ...(count && { count }),
        ...(appendToList && { appendToList }),
        activeView,
      });
    } catch (error) {
      Errors.handle(error);
      commit('FETCH_ERROR', {
        activeView,
      });
    }
  },

  // Add temporary actions to post so that UI updates immeadiately
  async doAddTemporaryPostAction(
    { commit, getters },
    { index, storeActionType, action },
  ) {
    const activeView = getters.activeView.id;

    // Add new action
    if (storeActionType === 'add') {
      commit('CREATE_TEMPORARY_ACTION', {
        action,
        activeView,
        index,
      });
      // Remove action
    } else {
      commit('REMOVE_TEMPORARY_ACTION', {
        action,
        activeView,
        index,
      });
    }
  },

  // Add or remove actions from the database depending on the action type
  async doUpdatePostAction(
    { state, dispatch, getters },
    {
      post, index, storeActionType, actionType,
    },
  ) {
    const activeView = getters.activeView.id;
    const action = state.views[activeView].list.posts[
      index
    ].actions.find((a) => a.type === actionType) || {
      type: actionType,
      timestamp: dateHelper(),
    };
    // Add new action
    if (storeActionType === 'add') {
      await dispatch('doAddAction', {
        post,
        action,
        index,
      });
      // Remove action
    } else {
      await dispatch('doRemoveAction', {
        postId: post.id,
        action,
        index,
      });
    }
  },

  async doAddAction(
    {
      state, commit, getters, rootGetters,
    },
    { post, action, index },
  ) {
    const activeView = getters.activeView.id;
    const oppositeActionTypes = {
      'thumbs-up': 'thumbs-down',
      'thumbs-down': 'thumbs-up',
    };
    const oppositeAction = state.views[
      activeView
    ].list.posts[index].actions.find(
      (a) => a.type === oppositeActionTypes[action.type],
    );

    // If action is thumbs, delete opposite thumbs from post
    if (
      oppositeActionTypes[action.type]
      && oppositeAction
    ) {
      commit('REMOVE_TEMPORARY_ACTION', {
        action: oppositeAction,
        activeView,
        index,
      });

      await EagleEyeService.deleteAction({
        postId: post.id,
        actionId: oppositeAction.id,
      });
    }

    const postDb = await EagleEyeService.createContent({
      post: {
        actions: [],
        platform: post.platform,
        post: post.post,
        postedAt: post.postedAt,
        url: post.url,
      },
    });

    const actionDb = await EagleEyeService.addAction({
      postId: postDb.id,
      action,
    });

    commit('CREATE_ACTION_SUCCESS', {
      post: postDb,
      action: actionDb,
      index,
      activeView,
    });

    // Update posts with new actions in local storage
    const authStore = useAuthStore();
    const { user, tenant } = storeToRefs(authStore);

    setResultsInStorage({
      posts: state.views.feed.list.posts,
      storageDate: dateHelper(),
      tenantId: tenant.value.id,
      userId: user.value.id,
    });
  },

  async doRemoveAction(
    {
      state, commit, getters, rootGetters,
    },
    { postId, action, index },
  ) {
    const activeView = getters.activeView.id;
    const actionId = action.id;
    const deleteImmeadiately = activeView === 'bookmarked'
      && action.type === 'bookmark';

    if (deleteImmeadiately) {
      commit('REMOVE_ACTION_SUCCESS', {
        postId,
        action,
        index,
        activeView,
      });
    }

    await EagleEyeService.deleteAction({
      postId,
      actionId,
    });

    if (!deleteImmeadiately) {
      commit('REMOVE_ACTION_SUCCESS', {
        postId,
        action,
        index,
        activeView,
      });
    }

    // Update posts with new actions in local storage
    const authStore = useAuthStore();
    const { user, tenant } = storeToRefs(authStore);

    setResultsInStorage({
      posts: state.views.feed.list.posts,
      storageDate: dateHelper(),
      tenantId: tenant.value.id,
      userId: user.value.id,
    });
  },

  doAddActionQueue({ commit, state, dispatch }, job) {
    commit('ADD_PENDING_ACTION', job);

    // If there are no actions active, start the next one in the queue
    if (Object.keys(state.activeAction).length === 0) {
      dispatch('doStartActionQueue');
    }
  },

  async doStartActionQueue({
    commit,
    dispatch,
    state,
    getters,
    rootGetters,
  }) {
    if (state.pendingActions.length > 0) {
      commit('SET_ACTIVE_ACTION', state.pendingActions[0]);

      const pendingAction = { ...state.pendingActions[0] };

      commit('POP_CURRENT_ACTION');

      try {
        await pendingAction.handler();
        await dispatch('doStartActionQueue');
      } catch (error) {
        // In case of an error, create post again and update it in UI
        EagleEyeService.createContent({
          post: pendingAction.post,
        }).then((response) => {
          const activeView = getters.activeView.id;
          const authStore = useAuthStore();
          const { user, tenant } = storeToRefs(authStore);

          commit('UPDATE_POST', {
            activeView,
            index: pendingAction.index,
            post: response,
          });

          // Update posts with new actions in local storage
          setResultsInStorage({
            posts: state.views.feed.list.posts,
            storageDate: dateHelper(),
            tenantId: tenant.value.id,
            userId: user.value.id,
          });
        });

        MessageStore.error(
          'Something went wrong. Please try again',
        );
        commit('SET_ACTIVE_ACTION', {});
      }
    }

    commit('SET_ACTIVE_ACTION', {});
  },

  async doUpdateSettings(
    { commit, dispatch },
    { data, fetchNewResults = true },
  ) {
    commit('UPDATE_EAGLE_EYE_SETTINGS_STARTED');
    const { getUser } = useAuthStore();
    return EagleEyeService.updateSettings(data)
      .then(() => {
        getUser().then(() => {
          commit('UPDATE_EAGLE_EYE_SETTINGS_SUCCESS');

          if (fetchNewResults) {
            dispatch('doFetch', {
              resetStorage: true,
            });
          }
          return Promise.resolve();
        });

        return Promise.resolve();
      })
      .catch((error) => {
        Errors.handle(error);
        commit('UPDATE_EAGLE_EYE_SETTINGS_ERROR');
        return Promise.reject();
      });
  },
};
