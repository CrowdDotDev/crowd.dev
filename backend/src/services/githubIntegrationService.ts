import { request } from '@octokit/request'
import { Octokit } from '@octokit/rest'

import { LlmService } from '@crowd/common_services'
import { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'
import { GithubIntegrationSettings } from '@crowd/integrations'
import { getServiceLogger } from '@crowd/logging'
import { PageData } from '@crowd/types'

import { IServiceOptions } from './IServiceOptions'
import { getGithubInstallationToken } from './helpers/githubToken'

// this is a hard limit for search endpoints https://docs.github.com/en/rest/search/search?apiVersion=2022-11-28#about-search
const githubMaxSearchResult = 1000

export default class GithubIntegrationService {
  constructor(private readonly options: IServiceOptions) {}

  public async findGithubRepos(
    query: string,
    limit: number = 30,
    offset: number = 0,
  ): Promise<PageData<any>> {
    const auth = await getGithubInstallationToken()
    const page = Math.floor(offset / limit) + 1 // offset to page conversion
    this.options.log.info(`Searching repo ${query}, page ${page} and limit: ${limit}`)
    const [orgRepos, repos] = await Promise.all([
      request('GET /search/repositories', {
        q: `owner:${query}`,
        per_page: limit,
        page,
        headers: {
          authorization: `bearer ${auth}`,
        },
      }).catch((err) => {
        this.options.log.error(`Error getting GitHub repositories for org: ${query}`, err)
        return { data: { items: [], total_count: 0 } }
      }),
      request('GET /search/repositories', {
        q: query,
        per_page: limit,
        page,
        headers: {
          authorization: `bearer ${auth}`,
        },
      }).catch((err) => {
        this.options.log.error(`Error getting GitHub repositories for org: ${query}`, err)
        return { data: { items: [], total_count: 0 } }
      }),
    ])

    const items = [...orgRepos.data.items, ...repos.data.items].map((item) => ({
      name: item.name,
      url: item.html_url,
      org: {
        name: item.owner.login,
        url: item.owner.html_url,
        logo: item.owner.avatar_url,
      },
    }))

    const count = Math.min(
      githubMaxSearchResult,
      Math.max(orgRepos.data.total_count || 0, repos.data.total_count || 0),
    )

    return {
      count,
      limit: Number(limit),
      offset: Number(offset),
      rows: items,
    }
  }

  public static async findOrgs(
    query: string,
    limit: number = 30,
    offset: number = 0,
  ): Promise<PageData<any>> {
    const auth = await getGithubInstallationToken()
    const page = Math.floor(offset / limit) + 1 // offset to page conversion

    const response = await request('GET /search/users', {
      q: query,
      per_page: limit,
      page,
      headers: {
        authorization: `bearer ${auth}`,
      },
    })

    const count = Math.min(response.data.total_count, githubMaxSearchResult)
    const items = response.data.items.map((item) => ({
      name: item.login,
      url: item.html_url,
      logo: item.avatar_url,
    }))

    return {
      count,
      limit: Number(limit),
      offset: Number(offset),
      rows: items,
    }
  }

  public static async getOrgRepos(org: string) {
    const token = await getGithubInstallationToken()
    const octokit = new Octokit({
      auth: `Bearer ${token}`,
    })

    const repos = await octokit.paginate(octokit.rest.repos.listForOrg, {
      org,
      per_page: 100, // max results per page is 100
    })

    return repos.map((repo) => ({
      name: repo.name,
      url: repo.html_url,
    }))
  }

  public static async findOrgDetail(org: string) {
    const auth = await getGithubInstallationToken()
    const logger = getServiceLogger()

    try {
      const { data } = await request('GET /orgs/{org}', {
        org,
        headers: {
          authorization: `bearer ${auth}`,
        },
      })

      if (!data) {
        return null
      }

      return {
        description: data.description || null,
        github: data.html_url,
        logoUrl: data.avatar_url,
        name: data.login,
        twitter: data.twitter_username || null,
        website: data.blog || null,
      }
    } catch (error) {
      logger.warn(`Failed to fetch org ${org}:`, error)
      return null
    }
  }

  public static async findOrgTopics(org: string, repos: { name: string }[]) {
    const auth = await getGithubInstallationToken()
    const logger = getServiceLogger()

    const topicSet = new Set<string>()

    const topicPromises = repos.map(async (repo) => {
      try {
        const res = await request(`GET /repos/${org}/${repo.name}/topics`, {
          headers: {
            authorization: `bearer ${auth}`,
          },
        })

        res.data.names.forEach((topic: string) => topicSet.add(topic))
      } catch (err) {
        logger.warn(`Failed to fetch topics for ${repo.name}:`, err.response?.data || err.message)
      }
    })

    await Promise.all(topicPromises)

    return Array.from(topicSet)
  }

  public static async findMainGithubOrganizationWithLLM(
    qx: QueryExecutor,
    projectName: string,
    orgs: GithubIntegrationSettings['orgs'],
  ): Promise<
    GithubIntegrationSettings['orgs'][number] & {
      description: string
    }
  > {
    const prompt = `Given the following array of organizations:
      ${orgs.map((org) => `organization name: ${org.name} organization url: ${org.url}`).join('\n')}

      project name: "${projectName}"

      Analyze the project’s content (e.g., README, code, metadata), along with the organization info (name and URL), to:

      1. Identify which organization from the array is the main one associated with the project. Return null if none is a clear match.
      2. Generate a neutral, objective description of what the project does.

      Use all available information to infer the description, with this priority:

      - First, use information from the organization URL, if available, as the most authoritative source.
      - Only use the project name if it clearly describes the functionality or scope. Ignore it if it's generic or non-descriptive (e.g., "test", "demo", "sample", "example", etc.).
      - If the project content is missing or uninformative, and the name is generic, **fall back to describing the organization and its typical projects instead**.

      Special rules:
      - If the array contains only one organization, assume that it is the one associated with the project (index 0), regardless of project content.
      - Still generate the description as usual, defaulting to the organization-level information if the project name/content do not add meaningful context.

      Return:
      - If no match is found: null
      - If a match is found: {description: string; index: number}

      Output ONLY valid JSON.
      Do NOT return any text, explanation, or formatting outside of the JSON.`

    const llmService = new LlmService(
      qx,
      {
        accessKeyId: process.env.CROWD_AWS_BEDROCK_ACCESS_KEY_ID,
        secretAccessKey: process.env.CROWD_AWS_BEDROCK_SECRET_ACCESS_KEY,
      },
      getServiceLogger(),
    )

    const { result } = await llmService.findMainGithubOrganization<{
      description: string
      index: number
    }>(prompt)

    if (
      typeof result === 'object' &&
      result !== null &&
      typeof result.description === 'string' &&
      typeof result.index === 'number'
    ) {
      return {
        ...orgs[result.index],
        description: result.description,
      }
    }

    return null
  }
}
