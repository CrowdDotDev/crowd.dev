import config from '@/config';

class AuthServiceClass {
  setToken(token: string) {
    localStorage.setItem('jwt', token);
  }

  getToken() {
    return localStorage.getItem('jwt');
  }

  setTenant(tenantId: string) {
    localStorage.setItem('currentTenant', config.lf.tenantId || tenantId);
  }

  getTenantId() {
    return config.lf.tenantId || localStorage.getItem('currentTenant');
  }

  logout() {
    localStorage.removeItem('jwt');
    localStorage.removeItem('currentTenant');
  }
}

export const AuthService = new AuthServiceClass();
