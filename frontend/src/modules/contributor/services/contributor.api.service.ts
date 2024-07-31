import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';
import { Contributor } from '@/modules/contributor/types/Contributor';

export class ContributorApiService {
  static async find(id: string, segments: string[]): Promise<Contributor> {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/member/${id}`,
      {
        params: {
          segments,
        },
      },
    );

    return response.data;
  }

  static async mergeSuggestions(limit: number, offset: number, query: any, segments: string[]) {
    const tenantId = AuthService.getTenantId();

    const data = {
      limit,
      offset,
      segments,
      detail: true,
      ...query,
    };

    return authAxios.post(
      `/tenant/${tenantId}/membersToMerge`,
      data,
    )
      .then(({ data }) => Promise.resolve(data));
  }

  static async update(id: string, data: Partial<Contributor>, segments: []) {
    const tenantId = AuthService.getTenantId();

    return authAxios.put(
      `/tenant/${tenantId}/member/${id}`,
      {
        ...data,
        segments,
      },
    ).then(({ data }) => Promise.resolve(data));
  }

  static async create(data: Partial<Contributor>, segments: string[]) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/member`,
      {
        ...data,
        segments,
      },
    );

    return response.data;
  }
}
