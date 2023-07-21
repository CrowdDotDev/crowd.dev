import _get from 'lodash/get';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';
import { tenantSubdomain } from '@/modules/tenant/tenant-subdomain';

export default {
  currentUser: (state) => state.currentUser,
  currentTenant: (state) => state.currentTenant,
  currentTenantUser: (state) => {
    const tenantId = state.currentTenant?.id;
    return state.currentUser?.tenants.find(
      (t) => t.tenantId === tenantId,
    );
  },
  currentUserEmail: (state, getters) => (getters.currentUser ? getters.currentUser.email : null),
  currentUserFullName: (state, getters) => (getters.currentUser ? getters.currentUser.fullName : ''),

  signedIn: (state, getters) => Boolean(getters.currentUser && getters.currentUser.id),

  roles: (state, getters) => {
    if (!getters.currentUser) {
      return [];
    }

    if (!getters.currentTenant) {
      return [];
    }

    const tenantUser = getters.currentUser.tenants.find(
      (userTenant) => userTenant.tenant.id === getters.currentTenant.id,
    );

    if (!tenantUser) {
      return [];
    }

    return tenantUser.roles;
  },

  emptyPermissions: (state, getters) => !getters.roles || !getters.roles.length,

  loading: (state) => Boolean(state.loading),

  loadingInit: (state) => state.loadingInit,

  loadingEmailConfirmation: (state) => Boolean(state.loadingEmailConfirmation),

  loadingPasswordResetEmail: (state) => Boolean(state.loadingPasswordResetEmail),

  loadingPasswordReset: (state) => Boolean(state.loadingPasswordReset),

  loadingPasswordChange: (state) => Boolean(state.loadingPasswordChange),

  loadingVerifyEmail: (state) => Boolean(state.loadingVerifyEmail),

  loadingUpdateProfile: (state) => Boolean(state.loadingUpdateProfile),

  currentUserNameOrEmailPrefix: (state, getters) => {
    if (!getters.currentUser) {
      return null;
    }

    if (
      getters.currentUserFullName
      && getters.currentUserFullName.length < 25
    ) {
      return getters.currentUserFullName;
    }

    if (getters.currentUser.firstName) {
      return getters.currentUser.firstName;
    }

    return getters.currentUser.email.split('@')[0];
  },

  currentUserAvatar: (state, getters) => {
    if (
      !getters.currentUser
      || !getters.currentUser.avatars
      || !getters.currentUser.avatars.length
      || !getters.currentUser.avatars[0].downloadUrl
    ) {
      return null;
    }

    return getters.currentUser.avatars[0].downloadUrl;
  },

  invitedTenants: (state, getters) => {
    if (
      !getters.currentUser
      || !getters.currentUser.tenants
    ) {
      return [];
    }

    return getters.currentUser.tenants
      .filter(
        (tenantUser) => tenantUser.status === 'invited',
      )
      .map((tenantUser) => tenantUser.tenant);
  },
  // I know, this is weird, but it is a hack
  // so Vue refreshed the backgroundImageUrl getter
  // based on the currentTenant on the store
  currentSettings: (state, getters) => (getters.currentTenant
    ? AuthCurrentTenant.getSettings()
    : AuthCurrentTenant.getSettings()),

  backgroundImageUrl: (state, getters) => {
    if (
      tenantSubdomain.isEnabled
      && tenantSubdomain.isRootDomain
    ) {
      return null;
    }

    const settings = getters.currentSettings;

    return _get(
      settings,
      'backgroundImageUrl',
      _get(
        settings,
        'backgroundImages[0].downloadUrl',
        null,
      ),
    );
  },

  logoUrl: (state, getters) => {
    if (
      tenantSubdomain.isEnabled
      && tenantSubdomain.isRootDomain
    ) {
      return null;
    }

    const settings = getters.currentSettings;

    return _get(
      settings,
      'logoUrl',
      _get(settings, 'logos[0].downloadUrl', null),
    );
  },
};
