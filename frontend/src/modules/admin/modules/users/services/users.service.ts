import authAxios from '@/shared/axios/auth-axios';

export class UsersService {
  static async list(query: any) {
    const response = await authAxios.get(
      '/user',
      {
        params: query,
      },
    );

    return response.data;
  }

  static async fetchGlobalIntegrations(query: any) {
    const response = await authAxios.get(
      '/integration/global',
      {
        params: query,
      },
    );

    return response.data;
  }

  static async fetchGlobalIntegrationStatusCount(query: any) {
    const response = await authAxios.get(
      '/integration/global/status',
      {
        params: query,
      },
    );

    return response.data;
  }
}
