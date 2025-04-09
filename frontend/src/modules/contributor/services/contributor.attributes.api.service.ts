import authAxios from '@/shared/axios/auth-axios';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';

const getSegments = () => {
  const lsSegmentsStore = useLfSegmentsStore();
  const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

  return selectedProjectGroup.value ? [selectedProjectGroup.value.id] : null;
};

export class ContributorAttributesApiService {
  static async list(memberId: string, segments: string[]) {
    return authAxios.get(
      `/member/${memberId}/attributes`,
      {
        params: {
          segments,
        },
      },
    ).then(({ data }) => Promise.resolve(data));
  }

  static async update(memberId: string, attributes: any) {
    return authAxios.patch(
      `/member/${memberId}/attributes`,
      {
        ...attributes,
        segments: getSegments(),
      },
    ).then(({ data }) => Promise.resolve(data));
  }
}
