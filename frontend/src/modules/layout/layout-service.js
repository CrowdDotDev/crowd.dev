import authAxios from '@/shared/axios/auth-axios';

export class LayoutService {
  static async getSystemStatus() {
    const response = await authAxios.get(
      'https://api.openstatus.dev/public/status/crowddev',
    );

    return response.status;
  }
}
