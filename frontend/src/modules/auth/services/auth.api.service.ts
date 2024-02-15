import authAxios from '@/shared/axios/auth-axios';
import { tenantSubdomain } from '@/modules/tenant/tenant-subdomain';
import AuthCurrentTenant from '@/modules/auth-old/auth-current-tenant';
import { User } from '@/modules/auth/types/User.type';

class AuthApiServiceClass {
  ssoGetToken(idToken: string): Promise<any> {
    return authAxios
      .post('/auth/sso/callback', {
        idToken,
        tenantId: tenantSubdomain.isSubdomain
          ? AuthCurrentTenant.get()
          : undefined,
      })
      .then((response) => {
        return response.data;
      });
  }

  fetchMe(): Promise<User> {
    return authAxios
      .get('/auth/me', {
        params: {
          excludeSegments: true,
        },
      }).then((response) => {
        return response.data;
      });
  }
}

export const AuthApiService = new AuthApiServiceClass();
