import { AuthToken } from '@/modules/auth/auth-token';
import { AuthService } from '@/modules/auth/auth-service';
import ProgressBar from '@/shared/progress-bar/progress-bar';
import Message from '@/shared/message/message';
import { i18n } from '@/i18n';
import Errors from '@/shared/error/errors';
import { router } from '@/router';
import { tenantSubdomain } from '@/modules/tenant/tenant-subdomain';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';
import { TenantService } from '@/modules/tenant/tenant-service';
import { buildInitialState, store } from '@/store';
import {
  connectSocket,
  disconnectSocket,
} from '@/modules/auth/auth-socket';
import { Auth0Service } from '@/shared/services/auth0.service';

export default {
  async doInit({ commit, dispatch }) {
    try {
      const token = AuthToken.get();
      if (token) {
        connectSocket(token);
        const currentUser = await AuthService.fetchMe();
        commit('AUTH_INIT_SUCCESS', { currentUser });
        return currentUser;
      }

      disconnectSocket();
      commit('AUTH_INIT_ERROR');
      return null;
    } catch (error) {
      console.error(error);
      disconnectSocket();
      console.log(error);
      commit('AUTH_INIT_ERROR');
      dispatch('doSignout');
      return null;
    } finally {
      ProgressBar.done();
    }
  },

  doWaitUntilInit({ getters }) {
    if (!getters.loadingInit) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const waitUntilInitInterval = setInterval(() => {
        if (!getters.loadingInit) {
          clearInterval(waitUntilInitInterval);
          resolve({});
        }
      }, 500);
    });
  },

  doSendEmailConfirmation({ commit }) {
    commit('EMAIL_CONFIRMATION_START');

    return AuthService.sendEmailVerification()
      .then(() => {
        Message.success(
          i18n('auth.verificationEmailSuccess'),
        );
        commit('EMAIL_CONFIRMATION_SUCCESS');
      })
      .catch((error) => {
        Errors.handle(error);
        commit('EMAIL_CONFIRMATION_ERROR');
      });
  },

  doSendPasswordResetEmail({ commit }, email) {
    commit('PASSWORD_RESET_EMAIL_START');

    return AuthService.sendPasswordResetEmail(email)
      .then((data) => {
        commit('PASSWORD_RESET_EMAIL_SUCCESS');
        return Promise.resolve(data);
      })
      .catch((error) => {
        Errors.handle(error);
        commit('PASSWORD_RESET_EMAIL_ERROR');
        return Promise.reject(error);
      });
  },

  doSigninWithEmailAndPassword(
    { commit },
    { email, password, rememberMe },
  ) {
    return Auth0Service.login({
      email,
      password,
    })
      .catch((error) => {
        commit('AUTH_ERROR');
        Message.error(typeof error.description === 'string' ? error.description : error.original.response.body.message);
      });
  },

  doSigninWithAuth0(
    { commit },
    token,
  ) {
    commit('AUTH_START');
    return AuthService.ssoGetToken(token)
      .then((token) => {
        AuthToken.set(token, true);
        return AuthService.fetchMe();
      })
      .then((currentUser) => {
        commit('AUTH_SUCCESS', {
          currentUser: currentUser || null,
        });
        router.push('/');
      })
      .catch((error) => {
        AuthService.signout();
        Errors.handle(error);
        commit('AUTH_ERROR');
      });
  },

  async doSignout({ commit }) {
    commit('AUTH_START');
    AuthService.signout();
    commit('AUTH_SUCCESS', {
      currentUser: null,
    });
    localStorage.removeItem('user');
    router.push({ name: 'logout' });
  },

  doRefreshCurrentUser({ commit }) {
    const token = AuthToken.get();
    if (token) {
      return AuthService.fetchMe()
        .then((currentUser) => {
          commit('CURRENT_USER_REFRESH_SUCCESS', {
            currentUser,
          });
          return currentUser;
        })
        .catch((error) => {
          AuthService.signout();
          Errors.handle(error);

          commit('CURRENT_USER_REFRESH_ERROR', error);
          return null;
        });
    }
    commit('CURRENT_USER_REFRESH_SUCCESS', {
      currentUser: null,
    });
    return Promise.resolve(null);
  },

  doUpdateProfile({ commit, dispatch }, data) {
    commit('UPDATE_PROFILE_START');
    return AuthService.updateProfile(data)
      .then(() => {
        commit('UPDATE_PROFILE_SUCCESS');
        return dispatch('doRefreshCurrentUser');
      })
      .then(() => {
        Message.success(i18n('auth.profile.success'));
      })
      .catch((error) => {
        Errors.handle(error);
        commit('UPDATE_PROFILE_ERROR');
      });
  },

  doChangePassword(
    { commit, dispatch },
    { oldPassword, newPassword },
  ) {
    commit('PASSWORD_CHANGE_START');
    return AuthService.changePassword(
      oldPassword,
      newPassword,
    )
      .then(() => {
        commit('PASSWORD_CHANGE_SUCCESS');
        return dispatch('doRefreshCurrentUser');
      })
      .then(() => {
        Message.success(i18n('auth.passwordChange.success'));
      })
      .catch((error) => {
        Errors.handle(error);
        commit('PASSWORD_CHANGE_ERROR');
      });
  },

  doVerifyEmail({ commit, dispatch }, token) {
    commit('EMAIL_VERIFY_START');
    return AuthService.verifyEmail(token)
      .then(() => {
        Message.success(i18n('auth.verifyEmail.success'));
        return dispatch('doRefreshCurrentUser');
      })
      .then(() => {
        commit('EMAIL_VERIFY_SUCCESS');
        router.push('/');
      })
      .catch((error) => {
        Errors.handle(error);
        commit('EMAIL_VERIFY_ERROR');
        dispatch('doSignout');
      });
  },

  doResetPassword(
    { commit, dispatch },
    { token, password },
  ) {
    commit('PASSWORD_RESET_START');
    return AuthService.passwordReset(token, password)
      .then(() => {
        commit('PASSWORD_RESET_SUCCESS');
      })
      .catch((error) => {
        Errors.handle(error);
        commit('PASSWORD_RESET_ERROR');
        dispatch('doSignout');
      });
  },

  async doSelectTenant({ dispatch, state }, { tenant, redirect = true, immediate = false }) {
    if (tenantSubdomain.isEnabled) {
      tenantSubdomain.redirectAuthenticatedTo(tenant.url);
      return;
    }

    if (immediate) {
      state.currentTenant = tenant;
    }
    AuthCurrentTenant.set(tenant);

    const initialState = buildInitialState(true);

    store.replaceState(initialState);

    await dispatch('doRefreshCurrentUser');

    if (redirect) {
      router.push('/');
    }
  },

  clearTenant({ commit }) {
    AuthCurrentTenant.set(null);
    commit('CLEAR_TENANT');
  },

  async doFinishOnboard({ dispatch, getters }, params) {
    return TenantService.update(getters.currentTenant.id, {
      onboardedAt: new Date(),
    })
      .then(() => dispatch('doRefreshCurrentUser'))
      .then(() => {
        router.push(params?.route ?? '/');
      });
  },
};
