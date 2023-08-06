import config from '@/config';
import { Auth0Client } from '@auth0/auth0-spa-js';
import { store } from '@/store';

const baseUrl = `${config.frontendUrl.protocol}://${config.frontendUrl.host}`;
const authCallback = `${baseUrl}/auth/callback`;

class Auth0ServiceClass {
  private readonly webAuth: Auth0Client;

  public constructor() {
    this.webAuth = new Auth0Client({
      domain: config.auth0.domain,
      clientId: config.auth0.clientId,
      authorizationParams: {
        redirect_uri: authCallback,
      },
      useCookiesForTransactions: true,
      useRefreshTokens: true,
      useRefreshTokensFallback: true,
    });
  }

  async loginWithRedirect() {
    return this.webAuth.loginWithRedirect();
  }

  async handleAuth() {
    return this.webAuth.handleRedirectCallback();
  }

  async init() {
    return this.webAuth.isAuthenticated().then(async (isAuthenticated) => {
      const currentUser = store.getters['auth/currentUser'];
      if (!isAuthenticated) {
        return this.webAuth.getTokenSilently().then(async () => {
          if (!currentUser) {
            await store.dispatch('auth/doInit');
          }

          store.dispatch('auth/doAuthenticate');

          return Promise.resolve();
        }).catch(() => {
          // If getTokenSilently() fails it's because user is not authenticated
          Auth0ServiceClass.localLogout();
          this.loginWithRedirect();

          return Promise.reject();
        });
      }

      if (!currentUser) {
        await store.dispatch('auth/doInit');
      }

      store.dispatch('auth/doAuthenticate');

      return Promise.resolve();
    });
  }

  public authData() {
    return this.webAuth.getIdTokenClaims()
      .then((idToken) => {
        if (idToken) {
        // eslint-disable-next-line no-underscore-dangle
          return idToken.__raw;
        }

        return null;
      });
  }

  public static localLogout() {
    localStorage.removeItem('jwt');
  }

  public logout() {
    Auth0ServiceClass.localLogout();
    this.webAuth.logout();
  }

  public getUser() {
    return this.webAuth.getUser().then((user) => user);
  }
}

export const Auth0Service = new Auth0ServiceClass();
