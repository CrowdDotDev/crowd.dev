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
    { post, action, index }
  ) {
    const activeView = getters.activeView.id

    try {
      commit('UPDATE_ACTION_LOADING', {
        index,
        activeView
      })

      // Create content in database
      const postResponse =
        await EagleEyeService.createContent({
          post
        })

      commit('CREATE_CONTENT_SUCCESS', {
        post: postResponse,
        index,
        activeView
      })

      // Add action to db content
      const actionData = {
        type: action,
        timestamp: moment().utc().format('YYYY-MM-DD')
      }

      const actionResponse =
        await EagleEyeService.addAction({
          postId: postResponse.id,
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
        posts: state.list.posts,
        tenantId: currentTenant.id,
        userId: currentUser.id
      })
    } catch (error) {
      commit('UPDATE_ACTION_ERROR', {
        index,
        activeView
      })
    }
  },

  async doRemoveAction(
    { state, commit, getters, rootGetters },
    { postId, actionId, actionType, index }
  ) {
    const activeView = getters.activeView.id

    try {
      commit('UPDATE_ACTION_LOADING', {
        index,
        activeView
      })

      await EagleEyeService.deleteAction({
        postId,
        actionId
      })

      commit('DELETE_ACTION_SUCCESS', {
        actionId,
        actionType,
        index,
        activeView
      })

      // Update local storage with updated action
      const currentUser = rootGetters['auth/currentUser']
      const currentTenant =
        rootGetters['auth/currentTenant']

      setResultsInStorage({
        posts: state.list.posts,
        tenantId: currentTenant.id,
        userId: currentUser.id
      })
    } catch (error) {
      commit('UPDATE_ACTION_ERROR', { index, activeView })
    }
  },

  async doUpdateSettings({ commit, dispatch }, data) {
    try {
      commit('UPDATE_EAGLE_EYE_SETTINGS_STARTED')

      await EagleEyeService.updateSettings(data)

      await dispatch(`auth/doRefreshCurrentUser`, null, {
        root: true
      })
      dispatch(`doFetch`, {
        resetStorage: true
      })

      commit('UPDATE_EAGLE_EYE_SETTINGS_SUCCESS')
    } catch (error) {
      Errors.handle(error)
      commit('UPDATE_EAGLE_EYE_SETTINGS_ERROR')
    }
  }
}
