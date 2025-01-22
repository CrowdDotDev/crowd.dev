import authAxios from '@/shared/axios/auth-axios';
import { ContributorIdentity } from '@/modules/contributor/types/Contributor';

export class ContributorIdentitiesApiService {
  static async list(memberId: string, segments: string[]) {
    return authAxios.get(
      `/member/${memberId}/identity`,
      {
        params: {
          segments,
        },
      },
    ).then(({ data }) => Promise.resolve(data));
  }

  static async createMultiple(memberId: string, identities: ContributorIdentity[]) {
    return authAxios.put(
      `/member/${memberId}/identity`,
      {
        identities,
      },
    ).then(({ data }) => Promise.resolve(data));
  }

  static async update(memberId: string, id: string, identity: Partial<ContributorIdentity>) {
    return authAxios.patch(
      `/member/${memberId}/identity/${id}`,
      identity,
    ).then(({ data }) => Promise.resolve(data));
  }

  static async delete(memberId: string, id: string) {
    return authAxios.delete(
      `/member/${memberId}/identity/${id}`,
    ).then(({ data }) => Promise.resolve(data));
  }
}
