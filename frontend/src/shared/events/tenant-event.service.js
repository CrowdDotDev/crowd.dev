import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';

export class TenantEventService {
  static async event(data) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/event-tracking`,
      data,
    );

    return response.data;
  }
}
