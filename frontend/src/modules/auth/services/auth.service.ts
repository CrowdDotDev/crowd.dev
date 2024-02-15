class AuthServiceClass {
  setToken(token: string) {
    localStorage.setItem('jwt', token);
  }

  setTenant(tenantId: string) {
    localStorage.setItem('tenantId', tenantId);
  }

  logout() {
    localStorage.removeItem('jwt');
    localStorage.removeItem('tenantId');
  }
}

export const AuthService = new AuthServiceClass();
