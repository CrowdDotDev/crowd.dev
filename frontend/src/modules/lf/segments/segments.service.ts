import authAxios from '@/shared/axios/auth-axios';
import { Pagination } from '@/shared/types/Pagination';
import { QueryFunction } from '@tanstack/vue-query';
import { ProjectGroup } from './types/Segments';

class SegmentsService {
  queryProjectGroups(
    query: () => Record<string, string | number | object>,
  ): QueryFunction<Pagination<ProjectGroup>> {
    return ({ pageParam = 0 }) => authAxios
      .post<Pagination<ProjectGroup>>('/segment/projectGroup/query', {
        ...query(),
        offset: pageParam,
        excludeSegments: true,
      })
      .then((res) => res.data);
  }

  getProjectGroupById(id: string) {
    return authAxios
      .get<ProjectGroup>(`/segment/${id}`, {
        params: {
          segments: [id],
        },
      })
      .then((res) => res.data);
  }

  updateSegment(id: string, data: ProjectGroup) {
    return authAxios
      .put<ProjectGroup>(`/segment/${id}`, {
        ...data,
        segments: [id],
      })
      .then((res) => res.data);
  }

  createSegment(query: () => Record<string, string | number | object>) {
    console.log('createSegment', query());
    return authAxios
      .post<ProjectGroup>('/segment/projectGroup', {
        ...query(),
        excludeSegments: true,
      })
      .then((res) => res.data);
  }
}

export const segmentService = new SegmentsService();
