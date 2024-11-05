import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';

export class UsersService {
  static async list(query: any) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/user`,
      {
        params: query,
      },
    );

    return response.data;
  }
}
