import authAxios from '@/shared/axios/auth-axios';
import { Pagination } from '@/shared/types/Pagination';
import { QueryFunction } from '@tanstack/vue-query';
import { ProjectGroup } from './types/Segments';

class SegmentsService {
  queryProjectGroups(
    query: () => Record<string, string | number | object>,
  ): QueryFunction<Pagination<ProjectGroup>> {
    console.log('queryProjectGroups', query);
    console.log('this', this);

    return ({ pageParam = 0 }) => authAxios
      .post('/segment/projectGroup/query', {
        ...query(),
        offset: pageParam,
        excludeSegments: true,
      })
      .then((res) => res.data);
  }
}

export const segmentService = new SegmentsService();
