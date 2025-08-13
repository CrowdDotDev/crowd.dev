import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { getSegmentsFromProjectGroup } from '@/utils/segments';
import { storeToRefs } from 'pinia';

const getSelectedProjectGroup = () => {
  const lsSegmentsStore = useLfSegmentsStore();
  const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

  return selectedProjectGroup.value;
};

export class ActivityService {
  static async query(body, countOnly = false) {
    // const segments = [
    //   ...body?.segments ?? getSegmentsFromProjectGroup(getSelectedProjectGroup()),
    //   getSelectedProjectGroup().id,
    // ];
    const response = await authAxios.post(
      '/activity/query',
      {
        ...body,
        countOnly,
        segments: body.segments,
      },
      {
        headers: {
          'x-crowd-api-version': '1',
        },
      },
    );

    return response.data;
  }

  static async listActivityTypes(segment) {
    const segments = segment || getSelectedProjectGroup()?.id;
    const response = await authAxios.get(
      '/activity/type',
      {
        params: {
          segments: segments ? [segments] : [],
        },
      },
    );

    return response.data;
  }

  static async listActivityChannels(segment) {
    const segments = segment || getSelectedProjectGroup()?.id;
    const response = await authAxios.get(
      '/activity/channel',
      {
        params: {
          segments: segments ? [segments] : [],
        },
      },
    );

    return response.data;
  }
}
