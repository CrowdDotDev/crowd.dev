import authAxios from '@/shared/axios/auth-axios';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';

export class DashboardApiService {
  static async fetchCubeData({ period, platform }) {
    const sampleTenant = AuthCurrentTenant.getSampleTenantData();
    const tenantId = sampleTenant?.id || AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/dashboard`,
      {
        headers: {
          Authorization: sampleTenant?.token,
        },
        params: {
          timeframe: period,
          platform,
        },
      },
    );

    return response.data;
  }
}
