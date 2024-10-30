import axios, { AxiosResponse } from 'axios'

import { getServiceChildLogger } from '@crowd/logging'

import { Repos } from '../../../types/regularTypes'

const commitsRegExp = /&page=(\d+)>; rel="last"/

const log = getServiceChildLogger('getRemoteStats')

export interface GitHubStats {
  stars: number
  forks: number
  totalIssues: number
  totalPRs: number
}

const checkHeaders = (response: AxiosResponse<any>, defaultValue = 0): number => {
  const link = response.headers.link
  if (link) {
    const matches = link.match(commitsRegExp)
    if (matches) {
      return parseInt(matches?.[1] as string, 10)
    }
    return defaultValue
  }
  return defaultValue
}

const getStatsForRepo = async (repoUrl: string, token: string): Promise<GitHubStats> => {
  const [owner, repo] = repoUrl.split('/').slice(-2)

  const query = `
        query {
        repository(owner: "${owner}", name: "${repo}") {
          starCount: stargazers {
            totalCount
          }
          forkCountDirect: forks {
            totalCount
          }
          forkCount
          issuesOpened: issues(states: OPEN) {
            totalCount
          }
          issuesClosed: issues(states: CLOSED) {
            totalCount
          }
        }
    }`

  const result = await axios.post(
    'https://api.github.com/graphql',
    {
      query,
    },
    {
      headers: {
        Authorization: `bearer ${token}`,
      },
    },
  )

  const prsAll = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=1`,
    {
      headers: {
        Authorization: `bearer ${token}`,
      },
    },
  )

  let out

  try {
    out = {
      stars: result.data.data.repository.starCount.totalCount,
      forks: result.data.data.repository.forkCountDirect.totalCount,
      totalIssues:
        result.data.data.repository.issuesOpened.totalCount +
        result.data.data.repository.issuesClosed.totalCount,
      totalPRs: checkHeaders(prsAll),
    }
  } catch (e) {
    log.error('Error getting stats for repo', e)
    throw e
  }

  return out
}

export const getGitHubRemoteStats = async (
  installToken: string,
  repos: Repos,
): Promise<GitHubStats> => {
  const stats = {
    stars: 0,
    forks: 0,
    totalIssues: 0,
    totalPRs: 0,
  }

  const statsPromises = repos.map((repo) => getStatsForRepo(repo.url, installToken))
  const allRepoStats = await Promise.all(statsPromises)

  allRepoStats.forEach((repoStats) => {
    stats.stars += repoStats.stars
    stats.forks += repoStats.forks
    stats.totalIssues += repoStats.totalIssues
    stats.totalPRs += repoStats.totalPRs
  })

  return stats
}
