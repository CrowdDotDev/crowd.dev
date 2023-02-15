import sharedActions from '@/shared/store/actions'
import { EagleEyeService } from '@/premium/eagle-eye/eagle-eye-service'
import Errors from '@/shared/error/errors'
import moment from 'moment'
import {
  getResultsFromStorage,
  setResultsInStorage,
  shouldFetchNewResults,
  isStorageUpdating
} from '@/premium/eagle-eye/eagle-eye-storage'
import Message from '@/shared/message/message'

export default {
  ...sharedActions('eagleEye'),
  async doFetch(
    { state, commit, getters, rootGetters },
    { keepPagination = false, resetStorage = false }
  ) {
    const currentUser = rootGetters['auth/currentUser']
    const currentTenant = rootGetters['auth/currentTenant']
    const activeView = getters.activeView.id
    let list = [],
      count = 0,
      appendToList = false

    // Edge case where new results were fetched but user changed tabs
    // This is to prevent a new fetch until the previous results were loaded
    if (
      activeView === 'feed' &&
      state.views[activeView].list.loading &&
      isStorageUpdating({
        tenantId: currentTenant.id,
        userId: currentUser.id
      })
    ) {
      return
    }

    try {
      commit('FETCH_STARTED', {
        keepPagination: resetStorage
          ? false
          : keepPagination,
        activeView
      })

      // Bookmarks View
      if (activeView === 'bookmarked') {
        const { sorter } = getters.activeView
        const response = await EagleEyeService.query(
          {
            action: {
              type: 'bookmark',
              ...(sorter === 'individualBookmarks' && {
                actionById: currentUser.id
              })
            }
          },
          getters.orderBy,
          getters.limit,
          getters.offset
        )

        list = response.rows
        count = response.count

        // Append to existing list if offset is not 0
        // User clicked on load more button
        if (getters.offset !== 0) {
          appendToList = true
        }
      }
      // Feed view
      else {
        // Fetch for new results when
        // resetStorage = true (settings were updated)
        // or criteria to fetch new results = true (new day)
        // or storage is waiting for results
        const fetchNewResults =
          resetStorage ||
          shouldFetchNewResults({
            tenantId: currentTenant.id,
            userId: currentUser.id
          }) ||
          isStorageUpdating({
            tenantId: currentTenant.id,
            userId: currentUser.id
          })

        if (fetchNewResults) {
          // Set storage to be in updating state
          setResultsInStorage({
            posts: [],
            storageDate: null,
            tenantId: currentTenant.id,
            userId: currentUser.id
          })

          list = await EagleEyeService.search()

          // Set new results in local storage
          setResultsInStorage({
            posts: list,
            storageDate: moment(),
            tenantId: currentTenant.id,
            userId: currentUser.id
          })
        } else {
          // Get results from local storage
          list = getResultsFromStorage({
            tenantId: currentTenant.id,
            userId: currentUser.id
          })
        }
      }

      // Only update view list results if active view is the same from the initial request
      // This is to prevent the user changing between tabs and the request was still loading
      commit('FETCH_SUCCESS', {
        list,
        ...(count && { count }),
        ...(appendToList && { appendToList }),
        activeView
      })
    } catch (error) {
      Errors.handle(error)
      commit('FETCH_ERROR', {
        activeView
      })
    }
  },

  async doAddAction(
    { state, commit, getters, rootGetters },
    { post, actionType, index }
  ) {
    const activeView = getters.activeView.id

    try {
      let updatedPost = JSON.parse(JSON.stringify(post))
      const oppositeActionTypes = {
        ['thumbs-up']: 'thumbs-down',
        ['thumbs-down']: 'thumbs-up'
      }
      const actionData = {
        type: actionType,
        timestamp: moment().utc().format('YYYY-MM-DD')
      }

      // Add action to post, update immeadiately in the UI
      commit('CREATE_ACTION_SUCCESS', {
        action: actionData,
        index,
        activeView
      })

      const oppositeAction = post.actions.find(
        (a) => a.type === oppositeActionTypes[actionType]
      )

      // If action is thumbs up, delete opposite thumbs from post
      if (
        oppositeActionTypes[actionType] &&
        oppositeAction
      ) {
        // Delete action from post, update immeadiately in the UI
        commit('DELETE_ACTION_SUCCESS', {
          actionType: oppositeActionTypes[actionType],
          index,
          activeView
        })

        updatedPost.actions = updatedPost.actions.filter(
          (a) => a.type !== oppositeActionTypes[actionType]
        )

        await EagleEyeService.deleteAction({
          postId: updatedPost.id,
          actionId: oppositeAction.id
        })
      }

      // Create content in database if payload does not have any actions yet
      if (!updatedPost.actions.length) {
        updatedPost = await EagleEyeService.createContent({
          post: {
            actions: updatedPost.actions,
            platform: updatedPost.platform,
            post: updatedPost.post,
            postedAt: updatedPost.postedAt,
            url: updatedPost.url
          }
        })

        commit('CREATE_CONTENT_SUCCESS', {
          post: updatedPost,
          index,
          activeView
        })
      }

      const actionResponse =
        await EagleEyeService.addAction({
          postId: updatedPost.id,
          actionData
        })

      commit('CREATE_ACTION_SUCCESS', {
        action: actionResponse,
        index,
        activeView
      })

      // Update local storage with updated action
      const currentUser = rootGetters['auth/currentUser']
      const currentTenant =
        rootGetters['auth/currentTenant']

      setResultsInStorage({
        storageDate: moment(),
        posts: state.views[activeView].list.posts,
        tenantId: currentTenant.id,
        userId: currentUser.id
      })
    } catch (error) {
      Message.error(
        'Something went wrong. Please try again'
      )

      commit('UPDATE_ACTION_ERROR', {
        index,
        activeView,
        actions: post.actions
      })
    }
  },

  async doRemoveAction(
    { state, commit, getters, rootGetters },
    { postId, actionId, actionType, index }
  ) {
    const activeView = getters.activeView.id
    const postActions =
      state.views[activeView].list.posts.find(
        (p) => p.id === postId
      )?.actions || []

    try {
      commit('DELETE_ACTION_SUCCESS', {
        actionType,
        index,
        activeView
      })

      await EagleEyeService.deleteAction({
        postId,
        actionId
      })

      // Update local storage with updated action
      const currentUser = rootGetters['auth/currentUser']
      const currentTenant =
        rootGetters['auth/currentTenant']

      setResultsInStorage({
        storageDate: moment(),
        posts: state.views[activeView].list.posts,
        tenantId: currentTenant.id,
        userId: currentUser.id
      })
    } catch (error) {
      Message.error(
        'Something went wrong. Please try again'
      )

      commit('UPDATE_ACTION_ERROR', {
        index,
        activeView,
        actions: postActions
      })
    }
  },

  async doUpdateSettings({ commit, dispatch }, data) {
    commit('UPDATE_EAGLE_EYE_SETTINGS_STARTED')
    return EagleEyeService.updateSettings(data)
      .then(() => {
        dispatch(`auth/doRefreshCurrentUser`, null, {
          root: true
        }).then(() => {
          commit('UPDATE_EAGLE_EYE_SETTINGS_SUCCESS')

          dispatch(`doFetch`, {
            resetStorage: true
          })
          return Promise.resolve()
        })
      })
      .catch((error) => {
        Errors.handle(error)
        commit('UPDATE_EAGLE_EYE_SETTINGS_ERROR')
        return Promise.reject()
      })
  }
}
