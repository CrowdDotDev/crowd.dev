import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';

export class EagleEyeService {
  static async query(filter, orderBy, limit, offset) {
    const body = {
      filter,
      orderBy,
      limit,
      offset,
    };

    const response = await authAxios.post(
      '/eagleEyeContent/query',
      body,
    );

    return response.data;
  }

  static async search() {
    const response = await authAxios.get(
      '/eagleEyeContent/search',
    );

    return response.data;
  }

  static async createContent({ post }) {
    const response = await authAxios.post(
      '/eagleEyeContent',
      post,
    );

    return response.data;
  }

  static async track({ event, params }) {
    const response = await authAxios.post(
      '/eagleEyeContent/track',
      {
        event,
        params,
      },
    );
    return response.data;
  }

  static async generateReply({ title, description }) {
    const response = await authAxios.get(
      '/eagleEyeContent/reply',
      {
        params: {
          title,
          description,
        },
      },
    );
    return response.data;
  }

  static async addAction({ postId, action }) {
    const response = await authAxios.post(
      `/eagleEyeContent/${postId}/action`,
      action,
    );

    return response.data;
  }

  static async deleteAction({ postId, actionId }) {
    const response = await authAxios.delete(
      `/eagleEyeContent/${postId}/action/${actionId}`,
    );

    return response.data;
  }

  static async updateSettings(data) {
    const response = await authAxios.put(
      '/eagleEyeContent/settings',
      data,
    );

    return response.data;
  }
}
