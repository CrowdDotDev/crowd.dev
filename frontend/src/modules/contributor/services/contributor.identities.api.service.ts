import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';
import { ContributorIdentity } from '@/modules/contributor/types/Contributor';

export class ContributorIdentitiesApiService {
  static async list(memberId: string, segments: string[]) {
    const tenantId = AuthService.getTenantId();

    return authAxios.get(
      `/tenant/${tenantId}/member/${memberId}/identity`,
      {
        params: {
          segments,
        },
      },
    ).then(({ data }) => Promise.resolve(data));
  }

  static async createMultiple(memberId: string, identities: ContributorIdentity[]) {
    const tenantId = AuthService.getTenantId();

    return authAxios.put(
      `/tenant/${tenantId}/member/${memberId}/identity`,
      {
        identities,
      },
    ).then(({ data }) => Promise.resolve(data));
  }

  static async update(memberId: string, id: string, identity: Partial<ContributorIdentity>) {
    const tenantId = AuthService.getTenantId();

    return authAxios.patch(
      `/tenant/${tenantId}/member/${memberId}/identity/${id}`,
      identity,
    ).then(({ data }) => Promise.resolve(data));
  }

  static async delete(memberId: string, id: string) {
    const tenantId = AuthService.getTenantId();

    return authAxios.delete(
      `/tenant/${tenantId}/member/${memberId}/identity/${id}`,
    ).then(({ data }) => Promise.resolve(data));
  }
}
