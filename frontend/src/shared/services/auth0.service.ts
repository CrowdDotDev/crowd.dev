import { WebAuth } from 'auth0-js';
import { LocalStorageEnum } from '@/shared/types/LocalStorage';
import config from '@/config';
import axios from 'axios';
import moment from 'moment';
import { Auth0Client } from '@auth0/auth0-spa-js';

const baseUrl = `${config.frontendUrl.protocol}://${config.frontendUrl.host}`;
const authCallback = `${baseUrl}/auth/callback`;
const redirectUri = `${baseUrl}/auth/signin`;

class Auth0ServiceClass {
  private readonly webAuth: Auth0Client;

  public constructor() {
    this.webAuth = new Auth0Client({
      domain: config.auth0.domain,
      clientId: config.auth0.clientId,
      authorizationParams: {
        redirect_uri: authCallback,
      },
    });
  }

  loginWithRedirect() {
    this.webAuth.loginWithRedirect();
  }

  public async handleAuth(code: string): Promise<void> {
    return this.webAuth.handleRedirectCallback()
      .then(() => this.webAuth.getIdTokenClaims())
      .then((idToken) => {
        if (idToken) {
          // eslint-disable-next-line no-underscore-dangle
          const actualIdToken = idToken.__raw;
          Auth0ServiceClass.localLogin({ id_token: actualIdToken, expires_in: idToken?.exp });
          return Promise.resolve();
        }
        return Promise.reject();
      });
  }

  public authData() {
    const idToken = localStorage.getItem(LocalStorageEnum.ID_TOKEN);
    const idTokenExpiration = localStorage.getItem(LocalStorageEnum.ID_TOKEN_EXPIRATION);

    if (idToken && idTokenExpiration) {
      const idTokenExpirationDate = new Date(parseInt(idTokenExpiration, 10));
      return {
        idToken,
        idTokenExpiration: idTokenExpirationDate,
      };
    }
    return null;
  }

  // Exchange authorization code for token
  private async exchange(code: string): Promise<any> {
    const body = {
      grant_type: 'authorization_code',
      client_id: config.auth0.clientId,
      code,
      redirect_uri: authCallback,
    };
    const response = await axios.post(`https://${config.auth0.domain}/oauth/token`, body);
    return response.data;
  }

  public static localLogin(authResult: any): void {
    localStorage.setItem(LocalStorageEnum.ID_TOKEN, authResult.id_token as string);
    localStorage.setItem(LocalStorageEnum.ID_TOKEN_EXPIRATION, authResult.expires_in);
  }

  public static localLogout() {
    localStorage.removeItem('jwt');
  }

  public logout(): void {
    Auth0ServiceClass.localLogout();
    this.webAuth.logout();
  }
}

export const Auth0Service = new Auth0ServiceClass();
