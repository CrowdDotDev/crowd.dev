import authAxios from '@/shared/axios/auth-axios';

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
      attributes,
    ).then(({ data }) => Promise.resolve(data));
  }
}
