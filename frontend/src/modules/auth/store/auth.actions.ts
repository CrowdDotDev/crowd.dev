import { Auth0Service } from '@/modules/auth/services/auth0.service';
import { AuthApiService } from '@/modules/auth/services/auth.api.service';
import { AuthService } from '@/modules/auth/services/auth.service';
import { User } from '@/modules/auth/types/User.type';
import Errors from '@/shared/error/errors';
import { disconnectSocket, connectSocket, isSocketConnected } from '@/modules/auth/auth.socket';
import identify from '@/shared/monitoring/identify';
import { watch } from 'vue';
import config from '@/config';
import { setRumUser } from '@/utils/datadog/rum';

export default {
  init() {
    if (window.location.pathname === '/auth/callback') {
      return;
    }
    Auth0Service.isAuthenticated()
      .then((isAuthenticated: boolean) => {
        if (!isAuthenticated) {
          this.handleLocalAuth()
            .catch(() => this.silentLogin());
        } else {
          this.silentLogin();
        }
      });
  },
  setLfxHeader() {
    const lfxHeader = document.getElementById('lfx-header');
    if (!lfxHeader || lfxHeader.authuser) {
      return;
    }
    Auth0Service.getUser().then((user) => {
      setRumUser(user.nickname);
      lfxHeader.authuser = user;
    });
  },
  silentLogin() {
    Auth0Service.getTokenSilently()
      .then(() => Auth0Service.authData())
      .then((token) => this.authCallback(token))
      .catch((error) => {
        if (['login_required', 'consent_required', 'missing_refresh_token'].includes(error.error)) {
          const appState: any = {};
          if (window.location.href) {
            appState.returnTo = window.location.href.replace(window.location.origin, '');
          }
          return this.signin({ appState });
        }
        return Promise.reject();
      });
  },
  handleLocalAuth() {
    if (['production', 'staging'].includes(config.env)) {
      return Promise.reject();
    }
    const storedToken = AuthService.getToken();
    const params = new URLSearchParams(window.location.search);
    const myJwt = params.get('my-jwt');

    const localToken = storedToken || myJwt;
    if (localToken) {
      return this.getUser(localToken);
    }

    return Promise.reject();
  },
  ensureLoaded(): Promise<void> {
    if (!this.user || !this.tenant) {
      return new Promise((resolve) => {
        const stopWatcher = watch(
          () => [this.user, this.tenant],
          ([newUser, newTenant]) => {
            if (newUser && newTenant) {
              this.setLfxHeader();
              resolve();
              stopWatcher();
            }
          },
          {
            immediate: true,
          },
        );
      });
    }
    // Both are already loaded
    return Promise.resolve();
  },
  getUser(token?: string) {
    const t = token || AuthService.getToken();
    if (!t) {
      return Promise.reject();
    }
    if (!isSocketConnected()) {
      connectSocket(t);
    }
    AuthService.setToken(t);
    return AuthApiService.fetchMe()
      .then((user) => {
        this.user = user;
        identify(user);
        this.setLfxHeader();
        const [tenantUser] = user.tenants;
        if (tenantUser && tenantUser.tenant) {
          this.tenant = tenantUser.tenant;
          AuthService.setTenant(tenantUser.tenantId);
        }
        return Promise.resolve(user);
      })
      .catch((error) => {
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
      .then((token) => this.getUser(token))
      .catch(() => this.logout());
  },
  signin(params?: any) {
    return Auth0Service.loginWithRedirect(params);
  },
  logout() {
    disconnectSocket();
    this.user = null;
    this.tenant = null;
    return Auth0Service.logout();
  },
};
