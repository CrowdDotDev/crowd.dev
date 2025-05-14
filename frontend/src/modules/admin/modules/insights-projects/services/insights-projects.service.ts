import authAxios from '@/shared/axios/auth-axios';
import { Pagination } from '@/shared/types/Pagination';
import { QueryFunction } from '@tanstack/vue-query';
import { InsightsProjectModel } from '../models/insights-project.model';

export class InsightsProjectsService {
  static async list(query: any) {
    const response = await authAxios.post(
      '/collections/insights-projects/query',
      query,
    );
    return response.data;
  }

  query(
    query: () => Record<string, string | number | object>,
  ): QueryFunction<Pagination<InsightsProjectModel>> {
    return ({ pageParam = 0 }) => authAxios
      .post<Pagination<InsightsProjectModel>>('/collections/insights-projects/query', {
        ...query(),
        offset: pageParam,
      })
      .then((res) => res.data);
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
export const INSIGHTS_PROJECTS_SERVICE = new InsightsProjectsService();
