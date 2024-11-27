import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';
import { GitHubOrganization, GitHubRepository } from '@/config/integrations/github/types/GithubSettings';

export class GithubApiService {
  static async searchRepositories(query: string): Promise<GitHubRepository[]> {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/integration/github/search/repos`,
      {
        params: {
          query,
        },
      },
    );

    return response.data;
  }

  static async searchOrganizations(query: string): Promise<GitHubOrganization[]> {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/integration/github/search/orgs`,
      {
        params: {
          query,
        },
      },
    );

    return response.data;
  }

  static async getOrganizationRepositories(name: string): Promise<GitHubRepository[]> {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/integration/github/orgs/${name}/repos`,
    );

    return response.data;
  }
}
