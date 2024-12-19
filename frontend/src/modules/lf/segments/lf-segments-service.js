import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';

export class LfService {
  // Segments

  static async findSegment(id) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/segment/${id}`,
      {
        params: {
          segments: [id],
        },
      },
    );

    return response.data;
  }

  static async listSegmentsByIds(ids) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/segment/id`,
      {
        ids,
      },
    );

    return response.data;
  }

  static async updateSegment(id, data) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.put(
      `/tenant/${tenantId}/segment/${id}`,
      {
        ...data,
        segments: [id],
      },
    );

    return response.data;
  }

  // Project Groups

  static async queryProjectGroups(body) {
    const tenantId = AuthService.getTenantId();

    if (!tenantId) {
      return { rows: [], count: 0 };
    }

    const response = await authAxios.post(
      `/tenant/${tenantId}/segment/projectGroup/query`,
      {
        ...body,
        excludeSegments: true,
      },
    );

    return response.data;
  }

  static async createProjectGroup(body) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/segment/projectGroup`,
      {
        ...body,
        excludeSegments: true,
      },
    );

    return response.data;
  }

  // Projects

  static async queryProjects(body) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/segment/project/query`,
      {
        ...body,
        ...(body.segments ? { segments: body.segments } : { excludeSegments: true }),
      },
    );

    return response.data;
  }

  static async createProject(body) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/segment/project`,
      body,
    );

    return response.data;
  }

  // Sub-projects

  static async createSubProject(body) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/segment/subproject`,
      body,
    );

    return response.data;
  }

  // Users

  static async fetchUsers(query, limit) {
    const params = {
      query,
      limit,
    };

    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/user/autocomplete`,
      {
        params,
      },
    );

    return response.data;
  }

  static async getUser(id) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/user/${id}`,
    );

    return response.data;
  }

  // AuditLogs

  static async fetchAuditLogs(data) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/audit-logs/query`,
      data,
    );

    return response.data;
  }
}
