import axios, { AxiosRequestConfig } from 'axios'

import { getServiceChildLogger } from '@crowd/logging'

import { Repos } from '../../../types/regularTypes'

const log = getServiceChildLogger('getInstalledRepositories')

/**
 * Normalizes forkedFrom URL for special cases.
 */
const normalizeForkedFrom = (forkedFrom: string | null): string | null => {
  if (!forkedFrom) {
    return null
  }

  // Special case: Linux kernel on GitHub should map to the official kernel.org git repository
  // because that's the one onboarded in our system, not the GitHub mirror.
  if (forkedFrom === 'https://github.com/torvalds/linux') {
    return 'https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux'
  }

  return forkedFrom
}

const getRepositoriesFromGH = async (page: number, installToken: string): Promise<any> => {
  const REPOS_PER_PAGE = 100

  const requestConfig = {
    method: 'get',
    url: `https://api.github.com/installation/repositories?page=${page}&per_page=${REPOS_PER_PAGE}`,
    headers: {
      Authorization: `Bearer ${installToken}`,
    },
  } as AxiosRequestConfig

  const response = await axios(requestConfig)
  return response.data
}

const parseRepos = (repositories: any): Repos => {
  const repos: Repos = []

  for (const repo of repositories) {
    repos.push({
      url: repo.html_url,
      owner: repo.owner.login,
      createdAt: repo.created_at,
      name: repo.name,
      fork: repo.fork,
      private: repo.private,
      cloneUrl: repo.clone_url,
      forkedFrom: normalizeForkedFrom(repo.parent?.html_url || null),
    })
  }

  return repos
}

export const getInstalledRepositories = async (installToken: string): Promise<Repos> => {
  try {
    let page = 1
    let hasMorePages = true

    const repos: Repos = []

    while (hasMorePages) {
      const data = await getRepositoriesFromGH(page, installToken)

      if (data.repositories) {
        repos.push(...parseRepos(data.repositories))
      }

      hasMorePages = data.total_count && data.total_count > 0 && data.total_count > repos.length
      page += 1
    }
    return repos.filter((repo) => !repo.private && !repo.fork)
  } catch (err: any) {
    log.error(err, 'Error fetching installed repositories!')
    throw err
  }
}
