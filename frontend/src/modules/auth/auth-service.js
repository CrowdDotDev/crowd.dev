import authAxios from '@/shared/axios/auth-axios';
import { AuthToken } from '@/modules/auth/auth-token';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';
import AuthInvitationToken from '@/modules/auth/auth-invitation-token';
import { tenantSubdomain } from '@/modules/tenant/tenant-subdomain';

export class AuthService {
  static sendEmailVerification() {
    return authAxios
      .post('/auth/send-email-address-verification-email', {
        tenantId: tenantSubdomain.isSubdomain
          ? AuthCurrentTenant.get()
          : undefined,
      })
      .then((response) => response.data);
  }

  static registerWithEmailAndPassword(
    email,
    password,
    acceptedTermsAndPrivacy,
    data = {},
  ) {
    const invitationToken = AuthInvitationToken.get();

    return authAxios
      .post('/auth/sign-up', {
        email,
        password,
        invitationToken,
        ...data,
        acceptedTermsAndPrivacy,
        tenantId: tenantSubdomain.isSubdomain
          ? AuthCurrentTenant.get()
          : undefined,
      })
      .then((response) => {
        AuthInvitationToken.clear();

        return response.data;
      });
  }

  static sendPasswordResetEmail(email) {
    return authAxios
      .post('/auth/send-password-reset-email', {
        email,
        tenantId: tenantSubdomain.isSubdomain
          ? AuthCurrentTenant.get()
          : undefined,
      })
      .then((response) => response.data);
  }

  static signinWithEmailAndPassword(email, password) {
    const invitationToken = AuthInvitationToken.get();

    return authAxios
      .post('/auth/sign-in', {
        email,
        password,
        invitationToken,
        tenantId: tenantSubdomain.isSubdomain
          ? AuthCurrentTenant.get()
          : undefined,
      })
      .then((response) => {
        AuthInvitationToken.clear();

        return response.data;
      });
  }

  static fetchMe() {
    return authAxios.get('/auth/me').then((response) => response.data);
  }

  static signout() {
    AuthToken.set(null, true);
  }

  static updateProfile(data) {
    return authAxios
      .put('/auth/profile', data)
      .then((response) => response.data);
  }

  static changePassword(oldPassword, newPassword) {
    const body = {
      oldPassword,
      newPassword,
    };

    return authAxios
      .put('/auth/change-password', body)
      .then((response) => response.data);
  }

  static passwordReset(token, password) {
    return authAxios
      .put('/auth/password-reset', {
        token,
        password,
        tenantId: tenantSubdomain.isSubdomain
          ? AuthCurrentTenant.get()
          : undefined,
      })
      .then((response) => response.data);
  }

  static verifyEmail(token) {
    return authAxios
      .put('/auth/verify-email', {
        token,
        tenantId: tenantSubdomain.isSubdomain
          ? AuthCurrentTenant.get()
          : undefined,
      })
      .then((response) => response.data);
  }

  static socialOnboard() {
    const invitationToken = AuthInvitationToken.get();

    return authAxios
      .post('/auth/social/onboard', {
        invitationToken,
        tenantId: tenantSubdomain.isSubdomain
          ? AuthCurrentTenant.get()
          : undefined,
      })
      .then((response) => {
        AuthInvitationToken.clear();
        return response.data;
      });
  }

  static isSocialOnboardRequested() {
    const urlParams = new URLSearchParams(
      window.location.search,
    );

    return Boolean(urlParams.get('social'));
  }
}
