import authAxios from '@/shared/axios/auth-axios';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';

export class LfService {
  static async queryProjectGroups(body) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/segment/query`,
      body,
    );

    return response.data;
  }

  static async findProjectGroup(id) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/segment/projectGroup/${id}`,
    );

    return response.data;
  }

  static async updateProjectGroup(id, body) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/segment/${id}`,
      body,
    );

    return response.data;
  }

  static async createProjectGroup(body) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/segment/projectGroup`,
      body,
    );

    return response.data;
  }

  static async createProject(body) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/segment/project`,
      body,
    );

    return response.data;
  }

  static async createSubProject(body) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/segment/subproject`,
      body,
    );

    return response.data;
  }
}
