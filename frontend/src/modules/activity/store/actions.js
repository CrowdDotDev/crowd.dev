import { ActivityService } from '@/modules/activity/activity-service'
import Errors from '@/shared/error/errors'
import { router } from '@/router'
import Message from '@/shared/message/message'
import { i18n } from '@/i18n'
import { ConversationService } from '@/modules/conversation/conversation-service'
import buildApiPayload from '@/shared/filter/helpers/build-api-payload'
import sharedActions from '@/shared/store/actions'

export default {
  ...sharedActions(),

  async doFetch(
    { commit, getters, state },
    { keepPagination = false }
  ) {
    try {
      commit('FETCH_STARTED', { keepPagination })

      let response

      if (getters.activeView.type === 'conversations') {
        response = await ConversationService.query(
          buildApiPayload(state.filter),
          getters.orderBy,
          getters.limit,
          getters.offset
        )
      } else {
        response = await ActivityService.list(
          state.filter,
          getters.orderBy,
          getters.limit,
          getters.offset
        )
      }

      commit('FETCH_SUCCESS', {
        rows: response.rows,
        count: response.count,
        type: getters.activeView.type
      })
    } catch (error) {
      Errors.handle(error)
      commit('FETCH_ERROR')
    }
  },

  async doFind({ commit, getters }, id) {
    try {
      commit('FIND_STARTED')

      let record
      if (getters.activeView.type === 'conversations') {
        record = await ConversationService.find(id)
      } else {
        record = await ActivityService.find(id)
      }
      commit('FIND_SUCCESS', {
        record,
        type: getters.activeView.type
      })
      return record
    } catch (error) {
      Errors.handle(error)
      commit('FIND_ERROR')
      router.push('/activities')
    }
  },

  async doDestroy({ commit, dispatch, getters }, id) {
    try {
      commit('DESTROY_STARTED')

      if (getters.activeView.type === 'conversations') {
        await ConversationService.destroyAll([id])
      } else {
        await ActivityService.destroyAll([id])
      }

      commit('DESTROY_SUCCESS', {
        id,
        type: getters.activeView.type
      })

      Message.success(
        i18n('entities.activity.destroy.success')
      )

      router.push('/activities')

      dispatch('doFetch', {
        keepPagination: true
      })
    } catch (error) {
      Errors.handle(error)
      commit('DESTROY_ERROR')
    }
  },

  async doDestroyAll({ commit, dispatch }, ids) {
    try {
      commit('DESTROY_ALL_STARTED')

      await ActivityService.destroyAll(ids)

      commit('DESTROY_ALL_SUCCESS')

      dispatch(`activity/doUnselectAll`, null, {
        root: true
      })

      Message.success(
        i18n('entities.activity.destroyAll.success')
      )

      router.push('/activities')

      dispatch('doFetch', {
        keepPagination: true
      })
    } catch (error) {
      Errors.handle(error)
      commit('DESTROY_ALL_ERROR')
    }
  },

  doChangeSort({ commit, state, dispatch }, sorter) {
    commit('SORTER_CHANGED', sorter)

    const filter = state.filter

    dispatch('doFetch', {
      filter,
      keepPagination: false
    })
  }
}
