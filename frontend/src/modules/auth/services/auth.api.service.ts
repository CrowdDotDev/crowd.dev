import authAxios from '@/shared/axios/auth-axios';
import { tenantSubdomain } from '@/modules/tenant/tenant-subdomain';
import { AuthService } from '@/modules/auth/services/auth.service';
import { User } from '@/modules/auth/types/User.type';

class AuthApiServiceClass {
  ssoGetToken(idToken: string): Promise<any> {
    return authAxios
      .post('/auth/sso/callback', {
        idToken,
        tenantId: tenantSubdomain.isSubdomain
          ? AuthService.getTenantId()
          : undefined,
      })
      .then((response) => response.data);
  }

  fetchMe(): Promise<User> {
    return authAxios
      .get('/auth/me', {
        params: {
          excludeSegments: true,
        },
      }).then((response) => response.data);
  }
}

export const AuthApiService = new AuthApiServiceClass();
