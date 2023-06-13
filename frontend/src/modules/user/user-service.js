import authAxios from '@/shared/axios/auth-axios';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';

export class UserService {
  static async edit(data) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/user`,
      {
        ...data,
        excludeSegments: true,
      },
    );

    return response.data;
  }

  static async destroy(ids) {
    const params = {
      ids,
      excludeSegments: true,
    };

    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.delete(
      `/tenant/${tenantId}/user`,
      {
        params,
      },
    );

    return response.data;
  }

  static async create(data) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/user`,
      {
        ...data,
        excludeSegments: true,
      },
    );

    return response.data;
  }

  static async import(values, importHash) {
    const body = {
      data: {
        ...values,
      },
      excludeSegments: true,
      importHash,
    };

    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/user/import`,
      body,
    );

    return response.data;
  }

  static async find(id) {
    const tenantId = AuthCurrentTenant.get();
    const response = await authAxios.get(
      `/tenant/${tenantId}/user/${id}`,
      {
        params: {
          excludeSegments: true,
        },
      },
    );
    return response.data;
  }

  static async fetchUsers(filter, orderBy, limit, offset) {
    const params = {
      filter,
      orderBy,
      limit,
      offset,
      excludeSegments: true,
    };

    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/user`,
      {
        params,
      },
    );

    return response.data;
  }

  static async fetchUserAutocomplete(query, limit) {
    const params = {
      query,
      limit,
      excludeSegments: true,
    };

    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/user/autocomplete`,
      {
        params,
      },
    );
    return response.data;
  }
}
