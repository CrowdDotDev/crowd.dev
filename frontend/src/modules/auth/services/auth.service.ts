import config from '@/config';

class AuthServiceClass {
  setToken(token: string) {
    localStorage.setItem('jwt', token);
  }

  getToken() {
    return localStorage.getItem('jwt');
  }

  setTenant(tenantId: string) {
    console.log('setted tenant id', tenantId);
    console.log('main tenant id', config.lf.tenantId || tenantId);
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
