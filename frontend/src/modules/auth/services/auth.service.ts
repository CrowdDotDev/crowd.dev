import { Auth0Service } from '@/modules/auth/services/auth0.service';

class AuthServiceClass {
  setToken(token: string) {
    localStorage.setItem('jwt', token);
  }

  getToken() {
    return localStorage.getItem('jwt');
  }

  setTenant(tenantId: string) {
    localStorage.setItem('currentTenant', tenantId);
  }

  getTenantId() {
    return localStorage.getItem('currentTenant');
  }

  logout() {
    localStorage.removeItem('jwt');
    localStorage.removeItem('currentTenant');
    Auth0Service.logout();
  }

  isDevmode() {
    return !!localStorage.getItem('devmode');
  }
}

export const AuthService = new AuthServiceClass();
