import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';
import { MemberOrganization } from '@/modules/organization/types/Organization';

export class ContributorOrganizationsApiService {
  static async list(memberId: string, segments: string[]) {
    const tenantId = AuthService.getTenantId();

    return authAxios.get(
      `/tenant/${tenantId}/member/${memberId}/organization`,
      {
        params: {
          segments,
        },
      },
    ).then(({ data }) => Promise.resolve(data));
  }

  static async create(memberId: string, data: Partial<MemberOrganization>) {
    const tenantId = AuthService.getTenantId();

    return authAxios.post(
      `/tenant/${tenantId}/member/${memberId}/organization`,
      data,
    ).then(({ data }) => Promise.resolve(data));
  }

  static async update(memberId: string, id: string, organization: Partial<MemberOrganization>) {
    const tenantId = AuthService.getTenantId();

    return authAxios.patch(
      `/tenant/${tenantId}/member/${memberId}/organization/${id}`,
      organization,
    ).then(({ data }) => Promise.resolve(data));
  }

  static async delete(memberId: string, id: string) {
    const tenantId = AuthService.getTenantId();

    return authAxios.delete(
      `/tenant/${tenantId}/member/${memberId}/organization/${id}`,
    ).then(({ data }) => Promise.resolve(data));
  }
}
