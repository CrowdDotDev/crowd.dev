import { request } from '@octokit/request'

import { IServiceOptions } from './IServiceOptions'
import { getGithubInstallationToken } from './helpers/githubToken'

export default class GithubIntegrationService {
  constructor(private readonly options: IServiceOptions) {}

  public async findGithubRepos(query: string) {
    const auth = await getGithubInstallationToken()

    const [orgRepos, repos] = await Promise.all([
      request('GET /search/repositories', {
        q: `owner:${query}`,
        headers: {
          authorization: `bearer ${auth}`,
        },
      }).catch((err) => {
        this.options.log.error(`Error getting GitHub repositories for org: ${query}`, err)
        return { data: { items: [] } }
      }),
      request('GET /search/repositories', {
        q: query,
        headers: {
          authorization: `bearer ${auth}`,
        },
      }).catch((err) => {
        this.options.log.error(`Error getting GitHub repositories for org: ${query}`, err)
        return { data: { items: [] } }
      }),
    ])

    return [...orgRepos.data.items, ...repos.data.items].map((item) => ({
      name: item.name,
      url: item.html_url,
      org: {
        name: item.owner.login,
        url: item.owner.html_url,
        logo: item.owner.avatar_url,
      },
    }))
  }

  public static async findOrgs(query: string) {
    const auth = await getGithubInstallationToken()
    const response = await request('GET /search/users', {
      q: query,
      headers: {
        authorization: `bearer ${auth}`,
      },
    })
    return response.data.items.map((item) => ({
      name: item.login,
      url: item.html_url,
      logo: item.avatar_url,
    }))
  }

  public static async getOrgRepos(org: string) {
    const auth = await getGithubInstallationToken()
    const response = await request('GET /orgs/{org}/repos', {
      org,
      headers: {
        authorization: `bearer ${auth}`,
      },
    })
    return response.data.map((repo) => ({
      name: repo.name,
      url: repo.html_url,
    }))
  }
}
