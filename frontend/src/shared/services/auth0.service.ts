import { WebAuth } from 'auth0-js';
import { LocalStorageEnum } from '@/shared/types/LocalStorage';
import config from '@/config';
import axios from 'axios';
import moment from 'moment';

const baseUrl = `${config.frontendUrl.protocol}://${config.frontendUrl.host}`;
const authCallback = `${baseUrl}/auth/callback`;
const redirectUri = `${baseUrl}/auth/signin`;

class Auth0ServiceClass {
  private readonly webAuth: WebAuth;

  public constructor() {
    this.webAuth = new WebAuth({
      domain: config.auth0.domain,
      clientID: config.auth0.clientId,
      redirectUri: authCallback,
      responseType: 'code',
      scope: 'openid profile email',
      // audience: `https://${config.auth0.domain}/userinfo`,
    });
  }

  public handleAuth(code: string): Promise<void> {
    return this.exchange(code)
      .then((authResult) => {
        Auth0ServiceClass.localLogin(authResult);
        return Promise.resolve();
      });
  }

  public authData() {
    const idToken = localStorage.getItem(LocalStorageEnum.ID_TOKEN);
    const accessToken = localStorage.getItem(LocalStorageEnum.ACCESS_TOKEN);
    const idTokenExpiration = localStorage.getItem(LocalStorageEnum.ID_TOKEN_EXPIRATION);

    if (idToken && idTokenExpiration) {
      const idTokenExpirationDate = new Date(parseInt(idTokenExpiration, 10));
      return {
        idToken,
        idTokenExpiration: idTokenExpirationDate,
        accessToken,
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
    localStorage.setItem(LocalStorageEnum.ACCESS_TOKEN, authResult.access_token as string);
    localStorage.setItem(LocalStorageEnum.ID_TOKEN_EXPIRATION, moment().add(authResult.expires_in, 'seconds').unix());
  }

  public static localLogout() {
    localStorage.removeItem('jwt');
  }

  public logout(): void {
    Auth0ServiceClass.localLogout();
    this.webAuth.logout({
      returnTo: redirectUri,
    });
  }

  public authorize(type: string) {
    this.webAuth.authorize({
      connection: type,
      redirectUri: authCallback,
    });
  }

  public changePassword(email: string) {
    return new Promise((resolve, reject) => {
      this.webAuth.changePassword(
        {
          email: email ?? '',
          connection: config.auth0.database,
        },
        (err) => {
          if (!err) {
            resolve(null);
          } else {
            reject(err);
          }
        },
      );
    });
  }

  public signup({
    email, password, firstName, lastName,
  }: Record<string, string>) {
    return new Promise((resolve, reject) => {
      this.webAuth.signup(
        {
          email: email ?? '',
          password: password ?? '',
          connection: config.auth0.database,
          given_name: firstName,
          family_name: lastName,
          name: `${firstName} ${lastName}`,
        } as any,
        (err) => {
          if (!err) {
            resolve(null);
          } else {
            reject(err);
          }
        },
      );
    });
  }

  public login({ email, password }: Record<string, string>) {
    return new Promise((resolve, reject) => {
      this.webAuth.login(
        {
          realm: config.auth0.database,
          email: email ?? '',
          password: password ?? '',
          redirectUri: authCallback,
        },
        (err) => {
          if (!err) {
            resolve(null);
          } else {
            reject(err);
          }
        },
      );
    });
  }
}

export const Auth0Service = new Auth0ServiceClass();
