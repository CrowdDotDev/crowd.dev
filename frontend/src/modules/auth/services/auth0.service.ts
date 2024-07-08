import config from '@/config';
import { Auth0Client } from '@auth0/auth0-spa-js';

const baseUrl = `${config.frontendUrl.protocol}://${config.frontendUrl.host}`;
const authCallback = `${baseUrl}/auth/callback`;

const scope = 'openid profile email';

class Auth0ServiceClass {
  private readonly webAuth: Auth0Client;

  public constructor() {
    this.webAuth = new Auth0Client({
      domain: config.auth0.domain,
      clientId: config.auth0.clientId,
      authorizationParams: {
        redirect_uri: authCallback,
        scope,
      },
      useCookiesForTransactions: true,
      useRefreshTokens: true,
      useRefreshTokensFallback: true,
    });
    console.log('init', {
      domain: config.auth0.domain,
      clientId: config.auth0.clientId,
      authorizationParams: {
        redirect_uri: authCallback,
        scope,
      },
      useCookiesForTransactions: true,
      useRefreshTokens: true,
      useRefreshTokensFallback: true,
    });
  }

  loginWithRedirect(params?: any) {
    const loginParams = {
      ...params,
      authorizationParams: {
        ...(params?.authorizationParams || {}),
        scope: params?.authorizationParams?.scope?.replace('offline_access', '').trim() || scope,
      },
    };
    console.log('login', loginParams);
    return this.webAuth.loginWithRedirect(loginParams);
  }

  handleAuth() {
    return this.webAuth.handleRedirectCallback();
  }

  isAuthenticated() {
    return this.webAuth.isAuthenticated();
  }

  getTokenSilently() {
    console.log('silently', {
      authorizationParams: {
        scope,
      },
    });
    return this.webAuth.getTokenSilently({
      authorizationParams: {
        scope,
      },
    });
  }

  authData() {
    return this.webAuth.getIdTokenClaims()
      .then((idToken) => {
        if (idToken) {
        // eslint-disable-next-line no-underscore-dangle
          return idToken.__raw;
        }

        return null;
      });
  }

  public logout() {
    return this.webAuth.logout();
  }

  public checkSession() {
    return this.webAuth.checkSession();
  }

  public getUser() {
    return this.webAuth.getUser();
  }
}

export const Auth0Service = new Auth0ServiceClass();
