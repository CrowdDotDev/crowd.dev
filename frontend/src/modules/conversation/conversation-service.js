import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';

export class ConversationService {
  static async destroyAll(ids, segments) {
    const params = {
      ids,
      segments,
    };

    const tenantId = AuthService.getTenantId();

    const response = await authAxios.delete(
      `/tenant/${tenantId}/conversation`,
      { params },
    );

    return response.data;
  }

  static async find(id, segments) {
    const sampleTenant = AuthCurrentTenant.getSampleTenantData();
    const tenantId = sampleTenant?.id || AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/conversation/${id}`,
      {
        headers: {
          Authorization: sampleTenant?.token,
        },
        params: {
          segments,
        },
      },
    );

    return response.data;
  }

  static async query(body) {
    const sampleTenant = AuthCurrentTenant.getSampleTenantData();
    const tenantId = sampleTenant?.id || AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/conversation/query`,
      body,
      {
        headers: {
          Authorization: sampleTenant?.token,
        },
      },
    );

    return response.data;
  }
}
