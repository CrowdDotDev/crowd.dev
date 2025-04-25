import authAxios from '@/shared/axios/auth-axios';
import {
  GitHubOrganization,
  GitHubRepository,
} from '@/config/integrations/github-nango/types/GithubSettings';

export class GithubApiService {
  static async searchRepositories(query: string): Promise<GitHubRepository[]> {
    const response = await authAxios.get('/integration/github/search/repos', {
      params: {
        query,
      },
    });

    return response.data;
  }

  static async searchOrganizations(
    query: string,
  ): Promise<GitHubOrganization[]> {
    const response = await authAxios.get('/integration/github/search/orgs', {
      params: {
        query,
      },
    });

    return response.data;
  }

  static async getOrganizationRepositories(
    name: string,
  ): Promise<GitHubRepository[]> {
    const response = await authAxios.get(
      `/integration/github/orgs/${name}/repos`,
    );

    return response.data;
  }
}
