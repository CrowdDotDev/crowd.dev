import { UserService } from '@/modules/user/user-service'
import Errors from '@/shared/error/errors'
import Message from '@/shared/message/message'
import { i18n } from '@/i18n'

export default {
  namespaced: true,

  state: () => {
    return {
      loading: false
    }
  },

  getters: {
    loading: (state) => Boolean(state.loading)
  },

  mutations: {
    DESTROY_ALL_STARTED(state) {
      state.loading = true
    },

    DESTROY_ALL_SUCCESS(state) {
      state.loading = false
    },

    DESTROY_ALL_ERROR(state) {
      state.loading = false
    },

    DESTROY_STARTED(state) {
      state.loading = true
    },

    DESTROY_SUCCESS(state) {
      state.loading = false
    },

    DESTROY_ERROR(state) {
      state.loading = false
    }
  },

  actions: {
    async doDestroy({ commit, dispatch, rootGetters }, id) {
      try {
        commit('DESTROY_STARTED')

        await UserService.destroy([id])

        commit('DESTROY_SUCCESS')

        Message.success(i18n('user.doDestroySuccess'))

        dispatch(
          `${'user/list'}/doFetch`,
          rootGetters[`${'user/list'}/filter`],
          {
            root: true
          }
        )
      } catch (error) {
        Errors.handle(error)
        commit('DESTROY_ERROR')
      }
    },

    async doDestroyAll(
      { commit, dispatch, rootGetters },
      ids
    ) {
      try {
        commit('DESTROY_ALL_STARTED')

        await UserService.destroy(ids)

        commit('DESTROY_ALL_SUCCESS')

        dispatch(`${'user/list'}/doUnselectAll`, null, {
          root: true
        })

        Message.success(i18n('user.doDestroyAllSuccess'))

        dispatch(
          `${'user/list'}/doFetch`,
          rootGetters[`${'user/list'}/filter`],
          {
            root: true
          }
        )
      } catch (error) {
        Errors.handle(error)
        commit('DESTROY_ALL_ERROR')
      }
    }
  }
}
