import authAxios from '@/shared/axios/auth-axios';
import { MemberOrganization } from '@/modules/organization/types/Organization';

export class ContributorOrganizationsApiService {
  static async list(memberId: string, segments: string[]) {
    return authAxios.get(
      `/member/${memberId}/organization`,
      {
        params: {
          segments,
        },
      },
    ).then(({ data }) => Promise.resolve(data));
  }

  static async create(memberId: string, data: Partial<MemberOrganization>) {
    return authAxios.post(
      `/member/${memberId}/organization`,
      data,
    ).then(({ data }) => Promise.resolve(data));
  }

  static async update(memberId: string, id: string, organization: Partial<MemberOrganization>) {
    return authAxios.patch(
      `/member/${memberId}/organization/${id}`,
      organization,
    ).then(({ data }) => Promise.resolve(data));
  }

  static async delete(memberId: string, id: string) {
    return authAxios.delete(
      `/member/${memberId}/organization/${id}`,
    ).then(({ data }) => Promise.resolve(data));
  }
}
