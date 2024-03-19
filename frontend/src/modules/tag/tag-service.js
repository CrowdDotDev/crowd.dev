import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';

export class TagService {
  static async update(id, data) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.put(
      `/tenant/${tenantId}/tag/${id}`,
      data,
    );

    return response.data;
  }

  static async destroyAll(ids) {
    const params = {
      ids,
    };

    const tenantId = AuthService.getTenantId();

    const response = await authAxios.delete(
      `/tenant/${tenantId}/tag`,
      {
        params,
      },
    );

    return response.data;
  }

  static async create(data) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/tag`,
      data,
    );

    return response.data;
  }

  static async find(id) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/tag/${id}`,
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

    const tenantId = AuthService.getTenantId();

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
    };

    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/tag/autocomplete`,
      {
        params,
      },
    );

    return response.data;
  }
}
