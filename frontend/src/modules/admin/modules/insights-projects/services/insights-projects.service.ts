import authAxios from '@/shared/axios/auth-axios';

export class InsightsProjectsService {
  static async list(query: any) {
    const response = await authAxios.post(
      '/collections/insights-projects/query',
      query,
    );
    return response.data;
  }

  static async getById(id: string) {
    const response = await authAxios.get(
      `/collections/insights-projects/${id}`,
    );
    return response.data;
  }

  static async create(request: any) {
    const response = await authAxios.post(
      '/collections/insights-projects',
      request,
    );
    return response.data;
  }

  static async update(id: string, request: any) {
    const response = await authAxios.post(
      `/collections/insights-projects/${id}`,
      request,
    );
    return response.data;
  }

  static async delete(collectionId: string) {
    const response = await authAxios.delete(
      `/collections/insights-projects/${collectionId}`,
    );

    return response.data;
  }

  static async querySubProjects(query: any) {
    const response = await authAxios.post(
      '/segment/subproject/query-lite',
      query,
    );
    return response.data;
  }

  static async getRepositories(segmentId: string) {
    const response = await authAxios.get(`/segments/${segmentId}/repositories`);
    return response.data;
  }
}
