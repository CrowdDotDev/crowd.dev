import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';
import { Organization } from '@/modules/organization/types/Organization';

export class OrganizationApiService {
  static async find(id: string, segments: string[]): Promise<Organization> {
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
}
