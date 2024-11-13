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

  static async fetchGlobalIntegrations(query: any) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/integration/global`,
      {
        params: query,
      },
    );

    return response.data;
  }

  static async fetchGlobalIntegrationStatusCount() {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/integration/global/status`,
    );

    return response.data;
  }
}
