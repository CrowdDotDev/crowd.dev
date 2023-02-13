import sharedActions from '@/shared/store/actions'
import { EagleEyeService } from '@/premium/eagle-eye/eagle-eye-service'
import Errors from '@/shared/error/errors'
import moment from 'moment'
import {
  getResultsFromStorage,
  setResultsInStorage,
  shouldFetchNewResults
} from '@/premium/eagle-eye/eagle-eye-storage'

export default {
  ...sharedActions('eagleEye'),
  async doFetch(
    { commit, getters, rootGetters },
    { keepPagination = false, resetStorage = false }
  ) {
    try {
      const currentUser = rootGetters['auth/currentUser']
      const currentTenant =
        rootGetters['auth/currentTenant']
      let list = [],
        count,
        appendToList

      commit('FETCH_STARTED', {
        keepPagination: resetStorage
          ? false
          : keepPagination
      })

      // Bookmarks View
      if (getters.activeView.id === 'bookmarked') {
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

        if (getters.offset !== 0) {
          appendToList = true
        }
      }
      // Feed view
      else {
        const fetchNewResults =
          resetStorage ||
          shouldFetchNewResults({
            tenantId: currentTenant.id,
            userId: currentUser.id
          })

        if (fetchNewResults) {
          list = await EagleEyeService.search()

          setResultsInStorage({
            posts: list,
            tenantId: currentTenant.id,
            userId: currentUser.id
          })
        } else {
          list = getResultsFromStorage({
            tenantId: currentTenant.id,
            userId: currentUser.id
          })
        }
      }

      commit('FETCH_SUCCESS', {
        list,
        ...(count && { count }),
        ...(appendToList && { appendToList })
      })
    } catch (error) {
      Errors.handle(error)
      commit('FETCH_ERROR')
    }
  },

  async doAddAction(
    { state, commit, rootGetters },
    { post, action, index }
  ) {
    try {
      commit('UPDATE_ACTION_LOADING', {
        index
      })

      // Create content in database
      const postResponse =
        await EagleEyeService.createContent({
          post
        })

      commit('CREATE_CONTENT_SUCCESS', {
        post: postResponse,
        index
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
        index
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
      commit('UPDATE_ACTION_ERROR')
    }
  },

  async doRemoveAction(
    { state, commit, getters, rootGetters },
    { postId, actionId, actionType, index }
  ) {
    try {
      commit('UPDATE_ACTION_LOADING', {
        index
      })

      await EagleEyeService.deleteAction({
        postId,
        actionId
      })

      commit('DELETE_ACTION_SUCCESS', {
        actionId,
        actionType,
        index,
        activeView: getters.activeView.id
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
      commit('UPDATE_ACTION_ERROR')
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
