import authAxios from '@/shared/axios/auth-axios';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';

export class TenantEventService {
  static async event(data) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/event-tracking`,
      data,
    );

    return response.data;
  }
}
