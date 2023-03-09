import Errors from '@/shared/error/errors'
import Message from '@/shared/message/message'
import { i18n } from '@/i18n'
import { UserService } from '@/modules/user/user-service'

export default {
  namespaced: true,

  state: () => {
    return {
      initLoading: false,
      saveLoading: false,
      record: null
    }
  },

  getters: {
    record: (state) => state.record,
    initLoading: (state) => Boolean(state.initLoading),
    saveLoading: (state) => Boolean(state.saveLoading)
  },

  mutations: {
    RESET(state) {
      state.initLoading = false
      state.saveLoading = false
      state.record = null
    },

    INIT_STARTED(state) {
      state.record = null
      state.initLoading = true
    },

    INIT_SUCCESS(state, payload) {
      state.record = payload
      state.initLoading = false
    },

    INIT_ERROR(state) {
      state.record = null
      state.initLoading = false
    },

    ADD_STARTED(state) {
      state.saveLoading = true
    },

    ADD_SUCCESS(state) {
      state.saveLoading = false
    },

    ADD_ERROR(state) {
      state.saveLoading = false
    },

    UPDATE_STARTED(state) {
      state.saveLoading = true
    },

    UPDATE_SUCCESS(state) {
      state.saveLoading = false
    },

    UPDATE_ERROR(state) {
      state.saveLoading = false
    }
  },

  actions: {
    async doInit({ commit }, id) {
      try {
        commit('INIT_STARTED')
        let record

        if (id) {
          record = await UserService.find(id)
        }

        commit('INIT_SUCCESS', record)
      } catch (error) {
        Errors.handle(error)
        commit('INIT_ERROR')
      }
    },

    async doAdd({ commit, rootGetters, dispatch }, values) {
      try {
        commit('ADD_STARTED')
        const response = await UserService.create(values)
        commit('ADD_SUCCESS')
        Message.success(i18n('user.doAddSuccess'))
        dispatch(
          `${'user/list'}/doFetch`,
          rootGetters[`${'user/list'}/filter`],
          {
            root: true
          }
        )
        return response
      } catch (error) {
        Errors.handle(error)
        commit('ADD_ERROR')
        throw error
      }
    },

    async doUpdate(
      { commit, rootGetters, dispatch },
      values
    ) {
      try {
        commit('UPDATE_STARTED')
        await UserService.edit(values)
        commit('UPDATE_SUCCESS')

        const currentUser = rootGetters['auth/currentUser']

        if (currentUser.id === values.id) {
          dispatch('auth/doRefreshCurrentUser', null, {
            root: true
          })
        }

        Message.success(i18n('user.doUpdateSuccess'))

        dispatch(
          `${'user/list'}/doFetch`,
          rootGetters[`${'user/list'}/filter`],
          {
            root: true
          }
        )
      } catch (error) {
        Errors.handle(error)
        commit('UPDATE_ERROR')
      }
    }
  }
}
