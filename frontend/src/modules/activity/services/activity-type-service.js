import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';

export class ActivityTypeService {
  static async create(data, segments) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/settings/activity/types`,
      {
        ...data,
        segments,
      },
    );

    return response.data;
  }

  static async update(key, data, segments) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.put(
      `/tenant/${tenantId}/settings/activity/types/${key}`,
      {
        ...data,
        segments,
      },
    );

    return response.data;
  }

  static async delete(key, segments) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.delete(
      `/tenant/${tenantId}/settings/activity/types/${key}`,
      {
        params: {
          segments,
        },
      },
    );

    return response.data;
  }

  static async get() {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/settings/activity/types`,
    );

    return response.data;
  }
}
