import { TenantService } from '@/modules/tenant/tenant-service'
import Errors from '@/shared/error/errors'
import { routerAsync } from '@/router'
import Message from '@/shared/message/message'
import { i18n } from '@/i18n'
import { PermissionChecker } from '@/premium/user/permission-checker'

export default {
  namespaced: true,

  state: {
    loading: false
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

        await TenantService.destroyAll([id])

        commit('DESTROY_SUCCESS')

        Message.success(i18n('tenant.destroy.success'))

        await dispatch('auth/doRefreshCurrentUser', null, {
          root: true
        })

        dispatch(
          `tenant/list/doFetch`,
          rootGetters[`tenant/list/filter`],
          {
            root: true
          }
        )

        const permissionChecker = new PermissionChecker(
          rootGetters['auth/currentTenant'],
          rootGetters['auth/currentUser']
        )

        if (permissionChecker.isEmptyTenant) {
          routerAsync().push('/auth/tenant')
        }
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

        await TenantService.destroyAll(ids)

        commit('DESTROY_ALL_SUCCESS')

        dispatch(`tenant/list/doUnselectAll`, null, {
          root: true
        })

        Message.success(i18n('tenant.destroyAll.success'))

        await dispatch('auth/doRefreshCurrentUser', null, {
          root: true
        })

        dispatch(
          `tenant/list/doFetch`,
          rootGetters[`tenant/list/filter`],
          {
            root: true
          }
        )

        const permissionChecker = new PermissionChecker(
          rootGetters['auth/currentTenant'],
          rootGetters['auth/currentUser']
        )

        if (permissionChecker.isEmptyTenant) {
          routerAsync().push('/auth/tenant')
        }
      } catch (error) {
        Errors.handle(error)
        commit('DESTROY_ALL_ERROR')
      }
    }
  }
}
