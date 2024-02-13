import { AuthService } from '@/modules/auth-old/auth-service';
import { connectSocket, disconnectSocket } from '@/modules/auth-old/auth-socket';
import { AuthToken } from '@/modules/auth-old/auth-token';
import { router } from '@/router';
import Errors from '@/shared/error/errors';
import { Auth0Service } from '@/modules/auth/services/auth0.service';

export default {
  authCallback(token: string, appState: any) {
    return AuthService.ssoGetToken(token)
      .then((token) => {
        connectSocket(token);
        AuthToken.set(token, true);
        return AuthService.fetchMe();
      })
      .then((currentUser) => {
        commit('AUTH_SUCCESS', {
          currentUser: currentUser || null,
        });

        window.history.replaceState(null, '', appState?.targetUrl ?? '/');
        window.history.pushState(null, '', appState?.targetUrl ?? '/');

        router.push(appState?.targetUrl ?? '/');
      })
      .catch((error) => {
        disconnectSocket();
        AuthService.signout();
        Errors.handle(error);
        commit('AUTH_ERROR');
      });
  },
  signin() {
    Auth0Service.loginWithRedirect();
  },
  logout() {
    Auth0Service.logout();
    this.user = null;
  },
};
