import authAxios from '@/shared/axios/auth-axios';

export class DashboardApiService {
  static async fetchChartData({ period, platform, segment }) {
    const response = await authAxios.get(
      '/dashboard',
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
