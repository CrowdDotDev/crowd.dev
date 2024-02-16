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
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/conversation/${id}`,
      {
        params: {
          segments,
        },
      },
    );

    return response.data;
  }

  static async query(body) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/conversation/query`,
      body,
    );

    return response.data;
  }
}
