import axios from 'axios';
import authAxios from '@/shared/axios/auth-axios';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';
import config from '@/config';

export class ReportService {
  static async update(id, data, segments) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/report/${id}`,
      {
        ...data,
        segments,
      },
    );

    return response.data;
  }

  static async duplicate(id, segments) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/report/${id}/duplicate`,
      {
        segments,
      },
    );

    return response.data;
  }

  static async destroyAll(ids) {
    const params = {
      ids,
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
      data,
    );

    return response.data;
  }

  static async find(id, segments) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/report/${id}`,
      {
        params: {
          segments,
        },
      },
    );

    return response.data;
  }

  static async findPublic(id, tenantId, segments) {
    const response = await axios.get(
      `${config.backendUrl}/tenant/${tenantId}/report/${id}`,
      {
        params: {
          segments,
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
