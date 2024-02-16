class AuthServiceClass {
  setToken(token: string) {
    localStorage.setItem('jwt', token);
  }

  getToken() {
    return localStorage.getItem('jwt');
  }

  setTenant(tenantId: string) {
    localStorage.setItem('tenantId', tenantId);
  }

  getTenantId() {
    return localStorage.getItem('tenantId');
  }

  logout() {
    localStorage.removeItem('jwt');
    localStorage.removeItem('tenantId');
  }
}

export const AuthService = new AuthServiceClass();
