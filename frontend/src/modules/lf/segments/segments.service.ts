import authAxios from '@/shared/axios/auth-axios';
import { Pagination } from '@/shared/types/Pagination';
import { QueryFunction } from '@tanstack/vue-query';
import { ProjectGroup } from './types/Segments';

class SegmentsService {
  queryProjectGroups(
    query: () => Record<string, string | number | object>,
  ): QueryFunction<Pagination<ProjectGroup>> {
    return async ({ pageParam = 0 }) => {
      const res = await authAxios.post('/segment/projectGroup/query', {
        ...query(),
        offset: pageParam,
        excludeSegments: true,
      });
      return res.data;
    };
  }
}

export const segmentService = new SegmentsService();
