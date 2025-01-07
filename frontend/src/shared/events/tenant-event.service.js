import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';

export class TenantEventService {
  static async event(data) {
    const response = await authAxios.post(
      '/event-tracking',
      data,
    );

    return response.data;
  }
}
