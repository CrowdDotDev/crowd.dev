import axios from 'axios';
import authAxios from '@/shared/axios/auth-axios';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';
import config from '@/config';

export class ReportService {
  static async update(id, data) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/report/${id}`,
      {
        ...data,
        excludeSegments: true,
      },
    );

    return response.data;
  }

  static async duplicate(id) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/report/${id}/duplicate`,
      {
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
      `/tenant/${tenantId}/report`,
      {
        params,
      },
    );

    return response.data;
  }

  static async create(data) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/report`,
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
      `/tenant/${tenantId}/report/${id}`,
      {
        params: {
          excludeSegments: true,
        },
      },
    );

    return response.data;
  }

  static async findPublic(id, tenantId) {
    const response = await axios.get(
      `${config.backendUrl}/tenant/${tenantId}/report/${id}`,
      {
        params: {
          excludeSegments: true,
        },
      },
    );

    return response.data;
  }

  static async list(filter, orderBy, limit, offset) {
    const params = {
      filter,
      orderBy,
      limit,
      offset,
      excludeSegments: true,
    };

    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/report`,
      {
        params,
      },
    );

    return response.data;
  }
}
