import authAxios from '@/shared/axios/auth-axios';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';

export class ActivityService {
  static async update(id, data, segments) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/activity/${id}`,
      {
        ...data,
        segments,
      },
    );

    return response.data;
  }

  static async destroyAll(ids, segments) {
    const params = {
      ids,
      segments,
    };

    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.delete(
      `/tenant/${tenantId}/activity`,
      {
        params,
      },
    );

    return response.data;
  }

  static async create(data, segments) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/activity`,
      {
        ...data.data,
        segments,
      },
    );

    return response.data;
  }

  static async query(
    body,
  ) {
    const sampleTenant = AuthCurrentTenant.getSampleTenantData();
    const tenantId = sampleTenant?.id || AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/activity/query`,
      body,
      {
        headers: {
          Authorization: sampleTenant?.token,
        },
      },
    );

    return response.data;
  }

  static async listActivityTypes() {
    const sampleTenant = AuthCurrentTenant.getSampleTenantData();
    const tenantId = sampleTenant?.id || AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/activity/type`,
      {
        headers: {
          Authorization: sampleTenant?.token,
        },
      },
    );

    return response.data;
  }

  static async listActivityChannels() {
    const sampleTenant = AuthCurrentTenant.getSampleTenantData();
    const tenantId = sampleTenant?.id || AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/activity/channel`,
      {
        headers: {
          Authorization: sampleTenant?.token,
        },
      },
    );

    return response.data;
  }
}
