import { AuthService } from '@/modules/auth/auth-service'
import Message from '@/shared/message/message'
import { i18n } from '@/i18n'
import Errors from '@/shared/error/errors'
import { routerAsync } from '@/router'
import ProgressBar from '@/shared/progress-bar/progress-bar'
import { AuthToken } from '@/modules/auth/auth-token'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'
import { tenantSubdomain } from '@/modules/tenant/tenant-subdomain'
import { SettingsService } from '@/modules/settings/settings-service'
import _get from 'lodash/get'
import { TenantService } from '../tenant/tenant-service'

export default {
  namespaced: true,

  state: {
    currentUser: null,
    currentTenant: null,
    loadingInit: true,
    loadingEmailConfirmation: false,
    loadingPasswordResetEmail: false,
    loadingVerifyEmail: false,
    loadingPasswordReset: false,
    loadingPasswordChange: false,
    loadingUpdateProfile: false,
    loading: false
  },

  getters: {
    currentUser: (state) => state.currentUser,
    currentTenant: (state) => state.currentTenant,
    currentUserEmail: (state, getters) =>
      getters.currentUser
        ? getters.currentUser.email
        : null,
    currentUserFullName: (state, getters) =>
      getters.currentUser
        ? getters.currentUser.fullName
        : '',

    signedIn: (state, getters) =>
      Boolean(
        getters.currentUser && getters.currentUser.id
      ),

    roles: (state, getters) => {
      if (!getters.currentUser) {
        return []
      }

      if (!getters.currentTenant) {
        return []
      }

      const tenantUser = getters.currentUser.tenants.find(
        (userTenant) =>
          userTenant.tenant.id === getters.currentTenant.id
      )

      if (!tenantUser) {
        return []
      }

      return tenantUser.roles
    },

    emptyPermissions: (state, getters) =>
      !getters.roles || !getters.roles.length,

    loading: (state) => Boolean(state.loading),

    loadingInit: (state) => Boolean(state.loadingInit),

    loadingEmailConfirmation: (state) =>
      Boolean(state.loadingEmailConfirmation),

    loadingPasswordResetEmail: (state) =>
      Boolean(state.loadingPasswordResetEmail),

    loadingPasswordReset: (state) =>
      Boolean(state.loadingPasswordReset),

    loadingPasswordChange: (state) =>
      Boolean(state.loadingPasswordChange),

    loadingVerifyEmail: (state) =>
      Boolean(state.loadingVerifyEmail),

    loadingUpdateProfile: (state) =>
      Boolean(state.loadingUpdateProfile),

    currentUserNameOrEmailPrefix: (state, getters) => {
      if (!getters.currentUser) {
        return null
      }

      if (
        getters.currentUserFullName &&
        getters.currentUserFullName.length < 25
      ) {
        return getters.currentUserFullName
      }

      if (getters.currentUser.firstName) {
        return getters.currentUser.firstName
      }

      return getters.currentUser.email.split('@')[0]
    },

    currentUserAvatar: (state, getters) => {
      if (
        !getters.currentUser ||
        !getters.currentUser.avatars ||
        !getters.currentUser.avatars.length ||
        !getters.currentUser.avatars[0].downloadUrl
      ) {
        return null
      }

      return getters.currentUser.avatars[0].downloadUrl
    },

    invitedTenants: (state, getters) => {
      if (
        !getters.currentUser ||
        !getters.currentUser.tenants
      ) {
        return []
      }

      return getters.currentUser.tenants
        .filter(
          (tenantUser) => tenantUser.status === 'invited'
        )
        .map((tenantUser) => tenantUser.tenant)
    },

    currentSettings: (state, getters) => {
      // I know, this is weird, but it is a hack
      // so Vue refreshed the backgroundImageUrl getter
      // based on the currentTenant on the store
      return getters.currentTenant
        ? AuthCurrentTenant.getSettings()
        : AuthCurrentTenant.getSettings()
    },

    conversationSettings: (state, getters) => {
      // I know, this is weird, but it is a hack
      // so Vue refreshed the backgroundImageUrl getter
      // based on the currentTenant on the store
      return getters.currentTenant
        ? AuthCurrentTenant.getConversationSettings()
        : AuthCurrentTenant.getConversationSettings()
    },

    backgroundImageUrl: (state, getters) => {
      if (
        tenantSubdomain.isEnabled &&
        tenantSubdomain.isRootDomain
      ) {
        return null
      }

      const settings = getters.currentSettings

      return _get(
        settings,
        'backgroundImageUrl',
        _get(
          settings,
          'backgroundImages[0].downloadUrl',
          null
        )
      )
    },

    logoUrl: (state, getters) => {
      if (
        tenantSubdomain.isEnabled &&
        tenantSubdomain.isRootDomain
      ) {
        return null
      }

      const settings = getters.currentSettings

      return _get(
        settings,
        'logoUrl',
        _get(settings, 'logos[0].downloadUrl', null)
      )
    }
  },

  mutations: {
    CURRENT_USER_REFRESH_SUCCESS(state, payload) {
      state.currentUser = payload.currentUser || null
      state.currentTenant = AuthCurrentTenant.selectAndSaveOnStorageFor(
        payload.currentUser
      )
    },

    AUTH_START(state) {
      state.loading = true
    },

    AUTH_SUCCESS(state, payload) {
      state.currentUser = payload.currentUser || null
      state.currentTenant = AuthCurrentTenant.selectAndSaveOnStorageFor(
        payload.currentUser
      )
      state.loading = false
    },

    AUTH_ERROR(state) {
      state.currentUser = null
      state.currentTenant = null
      state.loading = false
    },

    EMAIL_CONFIRMATION_START(state) {
      state.loadingEmailConfirmation = true
    },

    EMAIL_CONFIRMATION_SUCCESS(state) {
      state.loadingEmailConfirmation = false
    },

    EMAIL_CONFIRMATION_ERROR(state) {
      state.loadingEmailConfirmation = false
    },

    EMAIL_VERIFY_START(state) {
      state.loadingVerifyEmail = true
    },

    EMAIL_VERIFY_SUCCESS(state) {
      state.loadingVerifyEmail = false
    },

    EMAIL_VERIFY_ERROR(state) {
      state.loadingVerifyEmail = false
    },

    PASSWORD_CHANGE_START(state) {
      state.loadingPasswordChange = true
    },

    PASSWORD_CHANGE_SUCCESS(state) {
      state.loadingPasswordChange = false
    },

    PASSWORD_CHANGE_ERROR(state) {
      state.loadingPasswordChange = false
    },

    PASSWORD_RESET_START(state) {
      state.loadingPasswordReset = true
    },

    PASSWORD_RESET_SUCCESS(state) {
      state.loadingPasswordReset = false
    },

    PASSWORD_RESET_ERROR(state) {
      state.loadingPasswordReset = false
    },

    PASSWORD_RESET_EMAIL_START(state) {
      state.loadingPasswordResetEmail = true
    },

    PASSWORD_RESET_EMAIL_SUCCESS(state) {
      state.loadingPasswordResetEmail = false
    },

    PASSWORD_RESET_EMAIL_ERROR(state) {
      state.loadingPasswordResetEmail = false
    },

    UPDATE_PROFILE_START(state) {
      state.loadingUpdateProfile = true
    },

    UPDATE_PROFILE_SUCCESS(state) {
      state.loadingUpdateProfile = false
    },

    UPDATE_PROFILE_ERROR(state) {
      state.loadingUpdateProfile = false
    },

    AUTH_INIT_SUCCESS(state, payload) {
      state.currentUser = payload.currentUser || null
      state.currentTenant = AuthCurrentTenant.selectAndSaveOnStorageFor(
        payload.currentUser
      )
      state.loadingInit = false
    },

    AUTH_INIT_ERROR(state) {
      state.currentUser = null
      state.currentTenant = null
      state.loadingInit = false
    }
  },

  actions: {
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

        Message.success(
          i18n('auth.verificationEmailSuccess')
        )

        commit('EMAIL_CONFIRMATION_SUCCESS')
      } catch (error) {
        Errors.handle(error)
        commit('EMAIL_CONFIRMATION_ERROR')
      }
    },

    async doSendPasswordResetEmail({ commit }, email) {
      try {
        commit('PASSWORD_RESET_EMAIL_START')
        await AuthService.sendPasswordResetEmail(email)
        Message.success(
          i18n('auth.passwordResetEmailSuccess')
        )
        commit('PASSWORD_RESET_EMAIL_SUCCESS')
      } catch (error) {
        Errors.handle(error)
        commit('PASSWORD_RESET_EMAIL_ERROR')
      }
    },

    async doRegisterEmailAndPassword(
      { commit },
      { email, password }
    ) {
      try {
        commit('AUTH_START')

        const token = await AuthService.registerWithEmailAndPassword(
          email,
          password
        )

        AuthToken.set(token, true)

        const currentUser = await AuthService.fetchMe()

        commit('AUTH_SUCCESS', {
          currentUser
        })

        routerAsync().push('/')
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

        const token = await AuthService.signinWithEmailAndPassword(
          email,
          password
        )

        AuthToken.set(token, rememberMe)
        currentUser = await AuthService.fetchMe()

        commit('AUTH_SUCCESS', {
          currentUser
        })

        routerAsync().push('/')
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

        routerAsync().push('/auth/signin')
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
        routerAsync().push('/')
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
        routerAsync().push('/')
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
        routerAsync().push('/')
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
        routerAsync().push('/')
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
      SettingsService.applyThemeFromTenant()
      routerAsync().push('/')
    },

    async doFinishOnboard({ dispatch, getters }) {
      await TenantService.update(getters.currentTenant.id, {
        onboardedAt: new Date()
      })

      await dispatch('doRefreshCurrentUser')

      routerAsync().push('/')
    }
  }
}
