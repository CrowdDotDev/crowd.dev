import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';

export class AutomationService {
  static async update(id, data) {
    const body = {
      id,
      data,
      excludeSegments: true,
    };

    const response = await authAxios.put(
      `/automation/${id}`,
      body,
    );

    return response.data;
  }

  static async destroy(id) {
    const response = await authAxios.delete(
      `/automation/${id}`,
      {
        params: {
          excludeSegments: true,
        },
      },
    );

    return response.data;
  }

  static async destroyAll(ids) {
    const params = {
      ids,
      excludeSegments: true,
    };

    const response = await authAxios.delete(
      '/automation',
      {
        params,
      },
    );

    return response.data;
  }

  static publishAll(ids) {
    return Promise.all(ids.map((id) => {
      const body = {
        id,
        data: {
          state: true,
        },
        excludeSegments: true,
      };
      return authAxios.put(
        `/automation/${id}`,
        body,
      );
    }));
  }

  static unpublishAll(ids) {
    return Promise.all(ids.map((id) => {
      const body = {
        id,
        data: {
          state: false,
        },
        excludeSegments: true,
      };
      return authAxios.put(
        `/automation/${id}`,
        body,
      );
    }));
  }

  static async create(data) {
    const body = {
      data,
      excludeSegments: true,
    };

    const response = await authAxios.post(
      '/automation',
      body,
    );

    return response.data;
  }

  static async find(id) {
    const response = await authAxios.get(
      `/automation/${id}`,
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

    const response = await authAxios.get(
      '/automation',
      {
        params,
      },
    );

    return response.data;
  }

  static async listAutomationExecutions(
    automationId,
    orderBy,
    limit,
    offset,
  ) {
    const params = {
      orderBy,
      limit,
      offset,
      excludeSegments: true,
    };

    const response = await authAxios.get(
      `/automation/${automationId}/executions`,
      {
        params,
      },
    );

    return response.data;
  }
}
