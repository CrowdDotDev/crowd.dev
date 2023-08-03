import config from '@/config';
import { Auth0Client } from '@auth0/auth0-spa-js';
import { store } from '@/store';
import { router } from '@/router';

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

  async isAuthenticated() {
    return this.webAuth.isAuthenticated();
  }

  async handleAuth() {
    return this.webAuth.handleRedirectCallback();
  }

  async init() {
    return this.webAuth.isAuthenticated().then((isAuthenticated) => {
      if (!isAuthenticated) {
        return this.webAuth.getTokenSilently().then(() => {
          store.dispatch('auth/authenticate');

          return Promise.resolve();
        }).catch(() => {
          // If getTokenSilently() fails it's because user is not authenticated
          Auth0ServiceClass.localLogout();
          router.push({
            name: 'signin',
          });

          return Promise.reject();
        });
      }

      store.dispatch('auth/authenticate');

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
