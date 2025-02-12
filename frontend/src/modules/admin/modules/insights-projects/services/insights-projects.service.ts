import authAxios from '@/shared/axios/auth-axios';

export class InsightsProjectsService {
  static async list(query: any) {
    const response = await authAxios.post(
      '/collections/insights-projects/query',
      query,
    );
    return response.data;
  }

  static async delete(collectionId: string) {
    const response = await authAxios.delete(
      `/collections/insights-projects/${collectionId}`,
    );

    return response.data;
  }
}
