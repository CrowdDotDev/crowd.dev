import authAxios from '@/shared/axios/auth-axios';
import { Contributor } from '@/modules/contributor/types/Contributor';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';

const getSegments = () => {
  const lsSegmentsStore = useLfSegmentsStore();
  const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

  return selectedProjectGroup.value ? [selectedProjectGroup.value.id] : null;
};

export class ContributorApiService {
  static async find(id: string, segments: string[]): Promise<Contributor> {
    const response = await authAxios.get(
      `/member/${id}`,
      {
        params: {
          segments,
        },
      },
    );

    return response.data;
  }

  static async mergeSuggestions(limit: number, offset: number, query: any, segments: string[]) {
    const data = {
      limit,
      offset,
      segments,
      detail: true,
      ...query,
    };

    return authAxios.post(
      '/membersToMerge',
      data,
    )
      .then(({ data }) => Promise.resolve(data));
  }

  static async update(id: string, data: Partial<Contributor>) {
    return authAxios.put(
      `/member/${id}`,
      {
        ...data,
        segments: getSegments(),
      },
    ).then(({ data }) => Promise.resolve(data));
  }

  static async create(data: Partial<Contributor>) {
    const response = await authAxios.post(
      '/member',
      {
        ...data,
        segments: getSegments(),
      },
    );

    return response.data;
  }
}
