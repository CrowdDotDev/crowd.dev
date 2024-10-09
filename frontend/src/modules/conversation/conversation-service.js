import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';

export class ConversationService {
  static async destroyAll(ids, segments) {
    const params = {
      ids,
      segments,
    };

    const response = await authAxios.delete(
      '/conversation',
      { params },
    );

    return response.data;
  }

  static async find(id, segments) {
    const response = await authAxios.get(
      `/conversation/${id}`,
      {
        params: {
          segments,
        },
      },
    );

    return response.data;
  }

  static async query(body) {
    const response = await authAxios.post(
      '/conversation/query',
      body,
    );

    return response.data;
  }
}
