import { TenantService } from '@/modules/tenant/tenant-service'
import Errors from '@/shared/error/errors'
import { router } from '@/router'
import Message from '@/shared/message/message'
import { i18n } from '@/i18n'
import AuthInvitationToken from '@/modules/auth/auth-invitation-token'

export default {
  namespaced: true,

  state: () => {
    return {
      loading: false,
      warningMessage: null
    }
  },

  getters: {
    loading: (state) => Boolean(state.loading),
    warningMessage: (state) => state.warningMessage,
    invitationToken(
      state,
      getters,
      rootState,
      rootGetters
    ) {
      return (tenant) => {
        const currentUser = rootGetters['auth/currentUser']

        if (!currentUser || !currentUser.tenants) {
          return false
        }

        const tenantUser = currentUser.tenants.find(
          (tenantUser) =>
            tenantUser.tenant.id === tenant.id &&
            tenantUser.status === 'invited'
        )

        if (!tenantUser) {
          return null
        }

        return tenantUser.invitationToken
      }
    }
  },

  mutations: {
    ACCEPT_FROM_AUTH_STARTED(state) {
      state.warningMessage = null
      state.loading = true
    },

    ACCEPT_FROM_AUTH_SUCCESS(state) {
      state.warningMessage = null
      state.loading = false
    },

    ACCEPT_FROM_AUTH_WARNING(state, payload) {
      state.warningMessage = payload
      state.loading = false
    },

    ACCEPT_FROM_AUTH_ERROR(state) {
      state.warningMessage = null
      state.loading = false
    },

    ACCEPT_STARTED(state) {
      state.loading = true
    },

    ACCEPT_SUCCESS(state) {
      state.loading = false
    },

    ACCEPT_ERROR(state) {
      state.loading = false
    },

    DECLINE_STARTED(state) {
      state.loading = true
    },

    DECLINE_SUCCESS(state) {
      state.loading = false
    },

    DECLINE_ERROR(state) {
      state.loading = false
    }
  },

  actions: {
    async doAcceptFromAuth(
      { getters, commit, dispatch, rootGetters },
      { token, forceAcceptOtherEmail = false }
    ) {
      try {
        const isLoading = getters.loading

        if (isLoading) {
          return
        }

        const isSignedIn = rootGetters['auth/signedIn']

        if (!isSignedIn) {
          AuthInvitationToken.set(token)
          router.push('/auth/signup')
          return
        }

        commit('ACCEPT_FROM_AUTH_STARTED')

        const tenant = await TenantService.acceptInvitation(
          token,
          forceAcceptOtherEmail
        )

        await dispatch('auth/doSelectTenant', tenant, {
          root: true
        })

        commit('ACCEPT_FROM_AUTH_SUCCESS')
      } catch (error) {
        if (Errors.errorCode(error) === 404) {
          router.push('/')
          return
        }

        if (Errors.errorCode(error) === 400) {
          commit(
            'ACCEPT_FROM_AUTH_WARNING',
            Errors.selectMessage(error)
          )
          return
        }

        Errors.handle(error)
        commit('ACCEPT_FROM_AUTH_ERROR')
        router.push('/')
      }
    },

    async doAccept({ commit, dispatch }, token) {
      try {
        commit('ACCEPT_STARTED')

        const tenant = await TenantService.acceptInvitation(
          token
        )

        await dispatch('auth/doSelectTenant', tenant, {
          root: true
        })

        commit('ACCEPT_SUCCESS')
      } catch (error) {
        Errors.handle(error)
        commit('ACCEPT_ERROR')
      }
    },

    async doDecline(
      { commit, dispatch, rootGetters },
      token
    ) {
      try {
        commit('DECLINE_STARTED')

        await TenantService.declineInvitation(token)
        await dispatch('auth/doRefreshCurrentUser', null, {
          root: true
        })
        await dispatch(
          `tenant/list/doFetch`,
          rootGetters[`tenant/list/filter`],
          {
            root: true
          }
        )

        Message.success(i18n('tenant.invitation.declined'))

        commit('DECLINE_SUCCESS')

        router.push('/tenant')
      } catch (error) {
        Errors.handle(error)
        commit('DECLINE_ERROR')
      }
    }
  }
}
