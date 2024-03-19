import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';
import { router } from '@/router';

export class WidgetService {
  static async update(id, data) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.put(
      `/tenant/${tenantId}/widget/${id}`,
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

    const tenantId = AuthService.getTenantId();

    const response = await authAxios.delete(
      `/tenant/${tenantId}/widget`,
      {
        params,
      },
    );

    return response.data;
  }

  static async create(data) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/widget`,
      {
        ...data,
        excludeSegments: true,
      },
    );

    return response.data;
  }

  static async find(id) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/widget/${id}`,
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

    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/widget`,
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

    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/widget/autocomplete`,
      {
        params,
      },
    );

    return response.data;
  }

  static async getCubeToken() {
    let segments = [];

    if (router.currentRoute.value.params.segmentId) {
      segments = [router.currentRoute.value.params.segmentId];
    }

    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/cubejs/auth`,
      {
        params: {
          segments,
        },
      },
    );

    return response.data;
  }
}
