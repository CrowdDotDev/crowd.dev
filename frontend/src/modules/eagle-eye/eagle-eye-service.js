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

    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/eagleEyeContent/query`,
      body,
    );

    return response.data;
  }

  static async search() {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/eagleEyeContent/search`,
    );

    return response.data;
  }

  static async createContent({ post }) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/eagleEyeContent`,
      post,
    );

    return response.data;
  }

  static async track({ event, params }) {
    const tenantId = AuthService.getTenantId();
    const response = await authAxios.post(
      `/tenant/${tenantId}/eagleEyeContent/track`,
      {
        event,
        params,
      },
    );
    return response.data;
  }

  static async generateReply({ title, description }) {
    const tenantId = AuthService.getTenantId();
    const response = await authAxios.get(
      `/tenant/${tenantId}/eagleEyeContent/reply`,
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
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/eagleEyeContent/${postId}/action`,
      action,
    );

    return response.data;
  }

  static async deleteAction({ postId, actionId }) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.delete(
      `/tenant/${tenantId}/eagleEyeContent/${postId}/action/${actionId}`,
    );

    return response.data;
  }

  static async updateSettings(data) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.put(
      `/tenant/${tenantId}/eagleEyeContent/settings`,
      data,
    );

    return response.data;
  }
}
