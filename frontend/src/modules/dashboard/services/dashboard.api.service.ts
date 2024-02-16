import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';

export class DashboardApiService {
  static async fetchCubeData({ period, platform, segment }) {
    const sampleTenant = AuthCurrentTenant.getSampleTenantData();
    const tenantId = sampleTenant?.id || AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/dashboard`,
      {
        headers: {
          Authorization: sampleTenant?.token,
        },
        params: {
          timeframe: period,
          platform,
          segment,
          excludeSegments: true,
        },
      },
    );

    return response.data;
  }
}
