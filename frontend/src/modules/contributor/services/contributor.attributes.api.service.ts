import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';

export class ContributorAttributesApiService {
  static async list(memberId: string, segments: string[]) {
    const tenantId = AuthService.getTenantId();

    return authAxios.get(
      `/tenant/${tenantId}/member/${memberId}/attributes`,
      {
        params: {
          segments,
        },
      },
    ).then(({ data }) => Promise.resolve(data));
  }

  static async update(memberId: string, attributes: any) {
    const tenantId = AuthService.getTenantId();

    return authAxios.patch(
      `/tenant/${tenantId}/member/${memberId}/attributes`,
      attributes,
    ).then(({ data }) => Promise.resolve(data));
  }
}
