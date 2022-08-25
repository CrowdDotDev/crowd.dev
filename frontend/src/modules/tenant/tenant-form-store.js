import { TenantService } from '@/modules/tenant/tenant-service'
import Errors from '@/shared/error/errors'
import { routerAsync } from '@/router'
import Message from '@/shared/message/message'
import { i18n } from '@/i18n'

export default {
  namespaced: true,

  state: {
    initLoading: false,
    saveLoading: false,
    record: null
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

    CREATE_STARTED(state) {
      state.saveLoading = true
    },

    CREATE_SUCCESS(state) {
      state.saveLoading = false
    },

    CREATE_ERROR(state) {
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
          record = await TenantService.find(id)
        }

        commit('INIT_SUCCESS', record)
      } catch (error) {
        Errors.handle(error)
        commit('INIT_ERROR')
        routerAsync().push('/tenant')
      }
    },

    async doCreate({ dispatch, commit }, values) {
      try {
        commit('CREATE_STARTED')
        const tenant = await TenantService.create(values)
        await dispatch(`auth/doSelectTenant`, tenant, {
          root: true
        })

        commit('CREATE_SUCCESS')
        return true
      } catch (error) {
        Errors.handle(error)
        commit('CREATE_ERROR')

        return false
      }
    },

    async doUpdate({ commit, dispatch }, { id, values }) {
      try {
        commit('UPDATE_STARTED')

        const tenant = await TenantService.update(
          id,
          values
        )

        commit('UPDATE_SUCCESS')
        Message.success(i18n('tenant.update.success'))
        await dispatch(`auth/doSelectTenant`, tenant, {
          root: true
        })
      } catch (error) {
        Errors.handle(error)
        commit('UPDATE_ERROR')
      }
    }
  }
}
