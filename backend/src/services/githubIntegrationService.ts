import { request } from '@octokit/request'

import { GithubSnowflakeClient, SnowflakeClient } from '@crowd/snowflake'

import { IServiceOptions } from './IServiceOptions'

export default class GithubIntegrationService {
  constructor(private readonly options: IServiceOptions) {}

  public async getGithubRepositories(org: string) {
    const client = SnowflakeClient.fromEnv()
    this.options.log.info(`Getting GitHub repositories for org: ${org}`)
    const githubClient = new GithubSnowflakeClient(client)
    return githubClient.getOrgRepositories({ org, perPage: 10000 })
  }

  public static async findGithubRepos(query: string) {
    const [orgRepos, repos] = await Promise.all([
      request('GET /search/repositories', {
        q: `owner:${query}`,
      }).catch((err) => {
        this.options.log.error(`Error getting GitHub repositories for org: ${query}`, err)
        return { data: { items: [] } }
      }),
      request('GET /search/repositories', {
        q: query,
      }),
    ])

    // console.log([...orgRepos.data.items, ...repos.data.items])

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
    const response = await request('GET /search/users', {
      q: query,
    })
    return response.data.items.map((item) => ({
      name: item.login,
      url: item.html_url,
      logo: item.avatar_url,
    }))
  }

  public static async getOrgRepos(org: string) {
    const response = await request('GET /orgs/{org}/repos', {
      org,
    })
    return response.data.map((repo) => ({
      name: repo.name,
      url: repo.html_url,
    }))
  }
}
