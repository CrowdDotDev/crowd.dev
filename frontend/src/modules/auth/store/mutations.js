import formbricks, { setupFormbricks } from '@/plugins/formbricks';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';
import { isTrialExpired } from '@/utils/date';
import config from '@/config';

export default {
  CURRENT_USER_REFRESH_SUCCESS(state, payload) {
    state.currentUser = payload.currentUser || null;
    state.currentTenant = AuthCurrentTenant.selectAndSaveOnStorageFor(
      payload.currentUser,
    );
  },

  AUTH_START(state) {
    state.loading = true;
  },

  AUTH_SUCCESS(state, payload) {
    state.currentUser = payload.currentUser || null;
    state.currentTenant = AuthCurrentTenant.selectAndSaveOnStorageFor(
      payload.currentUser,
    );
    if (state.currentTenant && isTrialExpired(state.currentTenant)) {
      if (!window.location.href.includes('/onboard/plans')
        && !window.location.href.includes('/onboard/payment')
        && !window.location.href.includes('/auth/verify-email')) {
        window.location.href = `${config.frontendUrl.protocol}://${config.frontendUrl.host}/onboard/plans`;
      }
      return;
    }
    state.loading = false;

    if (state.currentUser) {
      // initialize Formbricks
      setupFormbricks(state.currentUser);
    }
  },

  AUTH_ERROR(state) {
    formbricks.logout();
    state.currentUser = null;
    state.currentTenant = null;
    state.loading = false;
  },

  EMAIL_CONFIRMATION_START(state) {
    state.loadingEmailConfirmation = true;
  },

  EMAIL_CONFIRMATION_SUCCESS(state) {
    state.loadingEmailConfirmation = false;
  },

  EMAIL_CONFIRMATION_ERROR(state) {
    state.loadingEmailConfirmation = false;
  },

  EMAIL_VERIFY_START(state) {
    state.loadingVerifyEmail = true;
  },

  EMAIL_VERIFY_SUCCESS(state) {
    state.loadingVerifyEmail = false;
  },

  EMAIL_VERIFY_ERROR(state) {
    state.loadingVerifyEmail = false;
  },

  PASSWORD_CHANGE_START(state) {
    state.loadingPasswordChange = true;
  },

  PASSWORD_CHANGE_SUCCESS(state) {
    state.loadingPasswordChange = false;
  },

  PASSWORD_CHANGE_ERROR(state) {
    state.loadingPasswordChange = false;
  },

  PASSWORD_RESET_START(state) {
    state.loadingPasswordReset = true;
  },

  PASSWORD_RESET_SUCCESS(state) {
    state.loadingPasswordReset = false;
  },

  PASSWORD_RESET_ERROR(state) {
    state.loadingPasswordReset = false;
  },

  PASSWORD_RESET_EMAIL_START(state) {
    state.loadingPasswordResetEmail = true;
  },

  PASSWORD_RESET_EMAIL_SUCCESS(state) {
    state.loadingPasswordResetEmail = false;
  },

  PASSWORD_RESET_EMAIL_ERROR(state) {
    state.loadingPasswordResetEmail = false;
  },

  UPDATE_PROFILE_START(state) {
    state.loadingUpdateProfile = true;
  },

  UPDATE_PROFILE_SUCCESS(state) {
    state.loadingUpdateProfile = false;
  },

  UPDATE_PROFILE_ERROR(state) {
    state.loadingUpdateProfile = false;
  },

  AUTH_INIT_SUCCESS(state, payload) {
    state.currentUser = payload.currentUser || null;

    state.currentTenant = AuthCurrentTenant.selectAndSaveOnStorageFor(
      payload.currentUser,
    );
    if (state.currentTenant && isTrialExpired(state.currentTenant)) {
      if (!window.location.href.includes('/onboard/plans')
        && !window.location.href.includes('/onboard/payment')
        && !window.location.href.includes('/auth/verify-email')) {
        window.location.href = `${config.frontendUrl.protocol}://${config.frontendUrl.host}/onboard/plans`;
      }
      return;
    }
    if (state.currentUser) {
      // initialize Formbricks
      setupFormbricks(state.currentUser);
    }
  },

  AUTH_INIT_ERROR(state) {
    formbricks.logout();
    state.currentUser = null;
    state.currentTenant = null;
    state.loadingInit = false;
  },

  CLEAR_TENANT(state) {
    state.currentTenant = null;
  },
};
