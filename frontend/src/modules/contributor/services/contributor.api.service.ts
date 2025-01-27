import authAxios from '@/shared/axios/auth-axios';
import { Contributor } from '@/modules/contributor/types/Contributor';

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

  static async update(id: string, data: Partial<Contributor>, segments: []) {
    return authAxios.put(
      `/member/${id}`,
      {
        ...data,
        segments,
      },
    ).then(({ data }) => Promise.resolve(data));
  }

  static async create(data: Partial<Contributor>, segments: string[]) {
    const response = await authAxios.post(
      '/member',
      {
        ...data,
        segments,
      },
    );

    return response.data;
  }
}
