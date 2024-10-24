import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';
import { Contributor } from '@/modules/contributor/types/Contributor';
import { Organization } from '@/modules/organization/types/Organization';

export class DataQualityApiService {
  static async findMemberIssues(params: any, segments: string[]): Promise<Contributor> {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/data-quality/member`,
      {
        params: {
          ...params,
          segments,
        },
      },
    );

    return response.data;
  }

  static async findOrganizationIssues(params: any, segments: string[]): Promise<Organization> {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/data-quality/organization`,
      {
        params: {
          ...params,
          segments,
        },
      },
    );

    return response.data;
  }
}
