import authAxios from '@/shared/axios/auth-axios';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';

export class QuickstartGuideService {
  static async fetch() {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/quickstart-guide`,
    );

    return response.data;
  }

  static async updateSettings(data) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/quickstart-guide/settings`,
      data,
    );

    return response.data;
  }
}
