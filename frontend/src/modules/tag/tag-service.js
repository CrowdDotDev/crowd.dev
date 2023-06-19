import authAxios from '@/shared/axios/auth-axios';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';

export class TagService {
  static async update(id, data, segments) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/tag/${id}`,
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
      `/tenant/${tenantId}/tag`,
      {
        params,
      },
    );

    return response.data;
  }

  static async create(data, segments) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/tag`,
      data,
      segments,
    );

    return response.data;
  }

  static async find(id, segments) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/tag/${id}`,
      {
        params: {
          segments,
        },
      },
    );

    return response.data;
  }

  static async list({
    filter,
    orderBy,
    limit,
    offset,
  }) {
    const params = {
      filter,
      orderBy,
      limit,
      offset,
    };

    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/tag`,
      {
        params,
      },
    );

    return response.data;
  }

  static async listAutocomplete({
    query,
    limit,
    segments = [],
  }) {
    const params = {
      query,
      limit,
      segments,
    };

    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/tag/autocomplete`,
      {
        params,
      },
    );

    return response.data;
  }
}
