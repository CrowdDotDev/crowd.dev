import sharedActions from '@/shared/store/actions'
import { EagleEyeService } from '@/premium/eagle-eye/eagle-eye-service'
import Errors from '@/shared/error/errors'
import moment from 'moment'

export default {
  ...sharedActions('eagleEye'),
  async doFetch({ commit, getters, rootGetters }) {
    try {
      let list = []
      commit('FETCH_STARTED')

      // Bookmarks View
      if (getters.activeView.id === 'bookmarked') {
        const { sorter } = getters.activeView
        const currentUser = rootGetters['auth/currentUser']
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
      }
      // Feed view
      else {
        list = await EagleEyeService.search()
      }

      commit('FETCH_SUCCESS', {
        list
      })
    } catch (error) {
      Errors.handle(error)
      commit('FETCH_ERROR')
    }
  },

  async doAddAction({ commit }, { post, action, index }) {
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
    } catch (error) {
      commit('UPDATE_ACTION_ERROR')
    }
  },

  async doRemoveAction(
    { commit },
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
        index
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

      commit('UPDATE_EAGLE_EYE_SETTINGS_SUCCESS')
    } catch (error) {
      Errors.handle(error)
      commit('UPDATE_EAGLE_EYE_SETTINGS_ERROR')
    }
  }
}
