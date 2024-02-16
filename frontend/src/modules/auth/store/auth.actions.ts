import { Auth0Service } from '@/modules/auth/services/auth0.service';
import { AuthApiService } from '@/modules/auth/services/auth.api.service';
import { AuthService } from '@/modules/auth/services/auth.service';
import { User } from '@/modules/auth/types/User.type';
import Errors from '@/shared/error/errors';
import { disconnectSocket, connectSocket } from '@/modules/auth/auth.socket';

export default {
  init() {
    Auth0Service.isAuthenticated()
      .then((isAuthenticated: boolean) => {
        if (!isAuthenticated) {
          Auth0Service.getTokenSilently()
            .then(() => Auth0Service.authData())
            .then((token) => this.authCallback(token))
            .catch((error) => {
              if (['login_required', 'consent_required', 'missing_refresh_token'].includes(error.error)) {
                const appState: any = {};
                if (window.location.hash) {
                  // Store the current virtual path or other data into appState to
                  // retrieve when handling a redirect callback.
                  appState.returnTo = window.location.hash;
                }
                return this.signin();
              }
              return Promise.reject();
            });
        }
      });
  },
  getUser(token: string) {
    connectSocket(token);
    AuthService.setToken(token);
    return AuthApiService.fetchMe()
      .then((currentUser) => {
        this.user = currentUser;
        const [tenantUser] = currentUser.tenants;
        if (tenantUser && tenantUser.tenant) {
          this.tenant = tenantUser.tenant;
          AuthService.setTenant(tenantUser.tenantId);
        }
        return Promise.resolve(currentUser);
      })
      .catch((error) => {
        disconnectSocket();
        AuthService.logout();
        Auth0Service.logout();
        Errors.handle(error);
        return Promise.reject(error);
      });
  },
  authCallback(token: string | null): Promise<User> {
    if (!token) {
      return Promise.reject();
    }
    return AuthApiService.ssoGetToken(token)
      .then((token) => this.getUser(token));
  },
  signin() {
    return Auth0Service.loginWithRedirect();
  },
  logout() {
    this.user = null;
    this.tenant = null;
    return Auth0Service.logout();
  },
};
