import { Auth0Service } from '@/modules/auth/services/auth0.service';

class AuthServiceClass {
  setToken(token: string) {
    localStorage.setItem('jwt', token);
  }

  getToken() {
    return localStorage.getItem('jwt');
  }

  logout() {
    localStorage.removeItem('jwt');
    Auth0Service.logout();
  }

  isDevmode() {
    return !!localStorage.getItem('devmode');
  }
}

export const AuthService = new AuthServiceClass();
