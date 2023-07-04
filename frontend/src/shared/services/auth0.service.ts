import { WebAuth, Auth0DecodedHash } from 'auth0-js';
import { LocalStorageEnum } from '@/shared/types/LocalStorage';
import config from '@/config';

const baseUrl = `${config.frontendUrl.protocol}://${config.frontendUrl.host}`;
const authCallback = `${baseUrl}/auth/callback`;
const redirectUri = `${baseUrl}/auth/signin`;

class Auth0ServiceClass {
  private readonly webAuth: WebAuth | undefined;

  public constructor() {
    if (config.auth0.domain) {
      this.webAuth = new WebAuth({
        domain: config.auth0.domain,
        clientID: config.auth0.clientId,
        redirectUri: authCallback,
        responseType: 'token id_token',
      });
    }
  }

  public handleAuth(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.webAuth.parseHash((error, result) => {
        if (error) {
          reject(error);
        } else {
          Auth0ServiceClass.localLogin(result as Auth0DecodedHash);
          resolve();
        }
      });
    });
  }

  public authData() {
    const idToken = localStorage.getItem(LocalStorageEnum.ID_TOKEN);
    const idTokenExpiration = localStorage.getItem(
      LocalStorageEnum.ID_TOKEN_EXPIRATION,
    );
    const profile = localStorage.getItem(LocalStorageEnum.AUTH_PROFILE);

    if (idToken && idTokenExpiration && profile) {
      const idTokenExpirationDate = new Date(parseInt(idTokenExpiration, 10));

      if (idTokenExpirationDate <= new Date()) {
        Auth0ServiceClass.localLogout();
      } else {
        return {
          idToken,
          idTokenExpiration: idTokenExpirationDate,
          profile: JSON.parse(profile),
        };
      }
    }
    return null;
  }

  public static localLogin(authResult: Auth0DecodedHash): void {
    const { idToken } = authResult;
    const profile = authResult.idTokenPayload;

    const tokenExpiry = new Date(profile.exp * 1000);

    localStorage.setItem(LocalStorageEnum.ID_TOKEN, idToken as string);
    localStorage.setItem(
      LocalStorageEnum.AUTH_PROFILE,
      JSON.stringify(profile),
    );
    localStorage.setItem(
      LocalStorageEnum.ID_TOKEN_EXPIRATION,
      tokenExpiry.getTime().toString(),
    );
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
    email,
    password,
    firstName,
    lastName,
  }: Record<string, string>) {
    return new Promise((resolve, reject) => {
      this.webAuth.signup(
        {
          email: email ?? '',
          username: email ?? '',
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
          username: email ?? '',
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
