import authAxios from '@/shared/axios/auth-axios';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';

export class TagService {
  static async update(id, data) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/tag/${id}`,
      {
        ...data,
        excludeSegments: true,
      },
    );

    return response.data;
  }

  static async destroyAll(ids) {
    const params = {
      ids,
      excludeSegments: true,
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

  static async create(data) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/tag`,
      {
        ...data,
        excludeSegments: true,
      },
    );

    return response.data;
  }

  static async find(id) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/tag/${id}`,
      {
        params: {
          excludeSegments: true,
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
  }) {
    const params = {
      query,
      limit,
      excludeSegments: true,
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
