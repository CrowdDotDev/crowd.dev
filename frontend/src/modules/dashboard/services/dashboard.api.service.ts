import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';

export class DashboardApiService {
  static async fetchChartData({ period, platform, segment }) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/dashboard`,
      {
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
