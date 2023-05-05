import authAxios from '@/shared/axios/auth-axios';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';

export class ActivityTypeService {
  static async create(data) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/settings/activity/types`,
      data,
    );

    return response.data;
  }

  static async update(key, data) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/settings/activity/types/${key}`,
      data,
    );

    return response.data;
  }

  static async delete(key) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.delete(
      `/tenant/${tenantId}/settings/activity/types/${key}`,
    );

    return response.data;
  }

  static async get() {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/settings/activity/types`,
    );

    return response.data;
  }
}
