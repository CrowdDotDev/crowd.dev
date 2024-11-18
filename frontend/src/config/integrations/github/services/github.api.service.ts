import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';

export class GithubApiService {
  static async searchReposAndOrgs(query: string): Promise<any> {
    const tenantId = AuthService.getTenantId();

    // TODO: implement this when backend is ready
    const response = await authAxios.get(
      `/tenant/${tenantId}/github/search`,
      {
        params: {
          search: query,
        },
      },
    );

    return response.data;
  }
}
