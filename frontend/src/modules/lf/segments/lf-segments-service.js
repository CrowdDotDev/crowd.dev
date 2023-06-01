import authAxios from '@/shared/axios/auth-axios';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';

export class LfService {
  // Segments

  static async findSegment(id) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/segment/${id}`,
      {
        excludeSegments: true,
      },
    );

    return response.data;
  }

  static async updateSegment(id, data) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/segment/${id}`,
      {
        ...data,
        excludeSegments: true,
      },
    );

    return response.data;
  }

  // Project Groups

  static async queryProjectGroups(body) {
    const tenantId = AuthCurrentTenant.get();

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
    const tenantId = AuthCurrentTenant.get();

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
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/segment/project/query`,
      {
        ...body,
        excludeSegments: true,
      },
    );

    return response.data;
  }

  static async createProject(body) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/segment/project`,
      {
        ...body,
        excludeSegments: true,
      },
    );

    return response.data;
  }

  // Sub-projects

  static async createSubProject(body) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/segment/subproject`,
      {
        ...body,
        excludeSegments: true,
      },
    );

    return response.data;
  }
}
