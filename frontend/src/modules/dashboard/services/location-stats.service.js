import { authAxios } from '@/shared/axios/auth-axios';
import { getSelectedProjectGroup } from '@/modules/lf/segments/helpers/lf-segments.helpers';

export class LocationStatsService {
  static async getMemberLocationStats(segments = []) {
    const response = await authAxios.get('/member/location-stats', {
      params: {
        segments: segments?.length ? segments : (getSelectedProjectGroup()?.id ? [getSelectedProjectGroup()?.id] : []),
      },
    });

    return response.data;
  }

  static async getOrganizationLocationStats(segments = []) {
    const response = await authAxios.get('/organization/location-stats', {
      params: {
        segments: segments?.length ? segments : (getSelectedProjectGroup()?.id ? [getSelectedProjectGroup()?.id] : []),
      },
    });

    return response.data;
  }
}