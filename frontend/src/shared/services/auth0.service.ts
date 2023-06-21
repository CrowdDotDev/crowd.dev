import { WebAuth, Auth0DecodedHash } from 'auth0-js';
import { LocalStorageEnum } from "@/shared/types/LocalStorage";

const authCallback = 'http://localhost:8081/auth/callback';
const redirectUri = 'http://localhost:8081/auth/signin';

class Auth0ServiceClass {
  private readonly webAuth: WebAuth;

  public constructor() {
    this.webAuth = new WebAuth({
      domain: (import.meta as any).VUE_APP_AUTH0_DOMAIN,
      clientID: (import.meta as any).VUE_APP_AUTH0_CLIENT_ID,
      redirectUri: authCallback,
      responseType: 'token id_token',
    });
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
    const idTokenExpiration = localStorage.getItem(LocalStorageEnum.ID_TOKEN_EXPIRATION);
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
    localStorage.setItem(LocalStorageEnum.AUTH_PROFILE, JSON.stringify(profile));
    localStorage.setItem(LocalStorageEnum.ID_TOKEN_EXPIRATION, tokenExpiry.getTime().toString());
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
}

export const Auth0Service = new Auth0ServiceClass();
