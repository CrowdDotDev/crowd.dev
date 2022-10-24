import { TenantService } from '@/modules/tenant/tenant-service'
import Errors from '@/shared/error/errors'
import Message from '@/shared/message/message'
import { i18n } from '@/i18n'
import AuthInvitationToken from '@/modules/auth/auth-invitation-token'
import { router } from '@/router'

export default {
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
