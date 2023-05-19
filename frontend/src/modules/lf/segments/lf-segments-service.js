import authAxios from '@/shared/axios/auth-axios';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';

export class LfService {
  // Segments

  static async findSegment(id) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/segment/${id}`,
    );

    return response.data;
  }

  static async updateSegment(id, data) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/segment/${id}`,
      data,
    );

    return response.data;
  }

  // Project Groups

  static async queryProjectGroups(body) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/segment/projectGroup/query`,
      body,
    );

    return response.data;
  }

  static async createProjectGroup(body) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/segment/projectGroup`,
      body,
    );

    return response.data;
  }

  // Projects

  static async queryProjects(body) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/segment/project/query`,
      body,
    );

    return response.data;
  }

  static async createProject(body) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/segment/project`,
      body,
    );

    return response.data;
  }

  // Sub-projects

  static async createSubProject(body) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/segment/subproject`,
      body,
    );

    return response.data;
  }
}
