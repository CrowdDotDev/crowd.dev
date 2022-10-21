import { AuthToken } from '@/modules/auth/auth-token'
import { AuthService } from '@/modules/auth/auth-service'
import ProgressBar from '@/shared/progress-bar/progress-bar'
import Message from '@/shared/message/message'
import { i18n } from '@/i18n'
import Errors from '@/shared/error/errors'
import { router } from '@/router'
import { tenantSubdomain } from '@/modules/tenant/tenant-subdomain'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'
import { TenantService } from '@/modules/tenant/tenant-service'

export default {
  async doInit({ commit, dispatch }) {
    try {
      const token = AuthToken.get()
      let currentUser = null

      if (token) {
        currentUser = await AuthService.fetchMe()
      }

      commit('AUTH_INIT_SUCCESS', { currentUser })
      ProgressBar.done()
    } catch (error) {
      console.error(error)
      commit('AUTH_INIT_ERROR')
      await dispatch('doSignout')
      ProgressBar.done()
    }
  },

  async doWaitUntilInit({ getters }) {
    if (!getters.loadingInit) {
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      const waitUntilInitInterval = setInterval(() => {
        if (!getters.loadingInit) {
          clearInterval(waitUntilInitInterval)
          resolve({})
        }
      }, 500)
    })
  },

  async doSendEmailConfirmation({ commit }) {
    try {
      commit('EMAIL_CONFIRMATION_START')

      await AuthService.sendEmailVerification()

      Message.success(i18n('auth.verificationEmailSuccess'))

      commit('EMAIL_CONFIRMATION_SUCCESS')
    } catch (error) {
      Errors.handle(error)
      commit('EMAIL_CONFIRMATION_ERROR')
    }
  },

  async doSendPasswordResetEmail({ commit }, email) {
    commit('PASSWORD_RESET_EMAIL_START')
    return AuthService.sendPasswordResetEmail(email)
      .then((data) => {
        Message.success(
          i18n('auth.passwordResetEmailSuccess')
        )
        commit('PASSWORD_RESET_EMAIL_SUCCESS')
        return Promise.resolve(data)
      })
      .catch((error) => {
        Errors.handle(error)
        commit('PASSWORD_RESET_EMAIL_ERROR')
        return Promise.reject(error)
      })
  },

  async doRegisterEmailAndPassword(
    { commit },
    { email, password }
  ) {
    try {
      commit('AUTH_START')

      const token =
        await AuthService.registerWithEmailAndPassword(
          email,
          password
        )

      AuthToken.set(token, true)

      const currentUser = await AuthService.fetchMe()

      commit('AUTH_SUCCESS', {
        currentUser
      })

      router.push('/')
    } catch (error) {
      await AuthService.signout()
      Errors.handle(error)
      commit('AUTH_ERROR')
    }
  },

  async doSigninWithEmailAndPassword(
    { commit },
    { email, password, rememberMe }
  ) {
    try {
      commit('AUTH_START')

      let currentUser = null

      const token =
        await AuthService.signinWithEmailAndPassword(
          email,
          password
        )

      AuthToken.set(token, rememberMe)
      currentUser = await AuthService.fetchMe()

      commit('AUTH_SUCCESS', {
        currentUser
      })

      router.push('/')
    } catch (error) {
      await AuthService.signout()
      Errors.handle(error)
      commit('AUTH_ERROR')
    }
  },

  async doSignout({ commit }) {
    try {
      commit('AUTH_START')
      await AuthService.signout()

      commit('AUTH_SUCCESS', {
        currentUser: null
      })

      router.push('/auth/signin')
    } catch (error) {
      Errors.handle(error)
      commit('AUTH_ERROR')
    }
  },

  async doRefreshCurrentUser({ commit }) {
    try {
      let currentUser = null
      const token = AuthToken.get()

      if (token) {
        currentUser = await AuthService.fetchMe()
      }

      commit('CURRENT_USER_REFRESH_SUCCESS', {
        currentUser
      })
    } catch (error) {
      AuthService.signout()
      Errors.handle(error)

      commit('CURRENT_USER_REFRESH_ERROR', error)
    }
  },

  async doUpdateProfile({ commit, dispatch }, data) {
    try {
      commit('UPDATE_PROFILE_START')

      await AuthService.updateProfile(data)

      commit('UPDATE_PROFILE_SUCCESS')
      await dispatch('doRefreshCurrentUser')
      Message.success(i18n('auth.profile.success'))
    } catch (error) {
      Errors.handle(error)
      commit('UPDATE_PROFILE_ERROR')
    }
  },

  async doChangePassword(
    { commit, dispatch },
    { oldPassword, newPassword }
  ) {
    try {
      commit('PASSWORD_CHANGE_START')
      await AuthService.changePassword(
        oldPassword,
        newPassword
      )
      commit('PASSWORD_CHANGE_SUCCESS')
      await dispatch('doRefreshCurrentUser')
      Message.success(i18n('auth.passwordChange.success'))
    } catch (error) {
      Errors.handle(error)
      commit('PASSWORD_CHANGE_ERROR')
    }
  },

  async doVerifyEmail({ commit, dispatch }, token) {
    try {
      commit('EMAIL_VERIFY_START')
      await AuthService.verifyEmail(token)
      Message.success(i18n('auth.verifyEmail.success'))
      await dispatch('doRefreshCurrentUser')
      commit('EMAIL_VERIFY_SUCCESS')
      router.push('/')
    } catch (error) {
      Errors.handle(error)
      commit('EMAIL_VERIFY_ERROR')
      await dispatch('doSignout')
    }
  },

  async doResetPassword(
    { commit, dispatch },
    { token, password }
  ) {
    try {
      commit('PASSWORD_RESET_START')
      await AuthService.passwordReset(token, password)
      Message.success(i18n('auth.passwordResetSuccess'))
      commit('PASSWORD_RESET_SUCCESS')
    } catch (error) {
      Errors.handle(error)
      commit('PASSWORD_RESET_ERROR')
      await dispatch('doSignout')
    }
  },

  async doSelectTenant({ dispatch }, tenant) {
    if (tenantSubdomain.isEnabled) {
      tenantSubdomain.redirectAuthenticatedTo(tenant.url)
      return
    }
    await dispatch(
      'widget/doResetStore',
      {},
      { root: true }
    )
    await dispatch(
      'report/doResetStore',
      {},
      { root: true }
    )

    AuthCurrentTenant.set(tenant)
    await dispatch('doRefreshCurrentUser')

    router.push('/')
  },

  async doFinishOnboard({ dispatch, getters }) {
    await TenantService.update(getters.currentTenant.id, {
      onboardedAt: new Date()
    })

    await dispatch('doRefreshCurrentUser')

    router.push('/')
  }
}
