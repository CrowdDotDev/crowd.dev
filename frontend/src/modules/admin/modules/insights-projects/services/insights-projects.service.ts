import authAxios from '@/shared/axios/auth-axios';
import { Pagination } from '@/shared/types/Pagination';
import { QueryFunction } from '@tanstack/vue-query';
import {
  InsightsProjectModel,
  InsightsProjectRequest,
} from '../models/insights-project.model';

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
      .post<Pagination<InsightsProjectModel>>(
        '/collections/insights-projects/query',
        {
          ...query(),
          offset: pageParam,
        },
      )
      .then((res) => res.data);
  }

  static async getById(id: string) {
    const response = await authAxios.get(
      `/collections/insights-projects/${id}`,
    );
    return response.data;
  }

  create(project: InsightsProjectRequest) {
    return authAxios
      .post<InsightsProjectModel>('/collections/insights-projects', project)
      .then((res) => res.data);
  }

  update(id: string, project: InsightsProjectRequest) {
    return authAxios
      .post<InsightsProjectModel>(`/collections/insights-projects/${id}`, project)
      .then((res) => res.data);
  }

  delete(id: string) {
    return authAxios
      .delete(`/collections/insights-projects/${id}`)
      .then((res) => res.data);
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
