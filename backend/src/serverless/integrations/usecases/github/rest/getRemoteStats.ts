import { getServiceChildLogger } from '@crowd/logging'
import axios, { AxiosResponse } from 'axios'
import { GITHUB_CONFIG } from '../../../../../conf'
import { getInstalledRepositories } from './getInstalledRepositories'

const IS_GITHUB_COMMIT_DATA_ENABLED = GITHUB_CONFIG.isCommitDataEnabled === 'true'

const log = getServiceChildLogger('getRemoteStats')

const commitsRegExp = /&page=(\d+)>; rel="last"/

interface Stats {
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

const getStatsForRepo = async (repoUrl: string, token: string): Promise<Stats> => {
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
          ref(qualifiedName: "refs/heads/main") {
            target {
              ... on Commit {
                history {
                  totalCount
                }
              }
            }
          }
          refMaster: ref(qualifiedName: "refs/heads/master") {
            target {
              ... on Commit {
                history {
                  totalCount
                }
              }
            }
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

  return {
    stars: result.data.data.repository.starCount.totalCount,
    forks: result.data.data.repository.forkCountDirect.totalCount,
    totalIssues:
      result.data.data.repository.issuesOpened.totalCount +
      result.data.data.repository.issuesClosed.totalCount,
    totalPRs: checkHeaders(prsAll),
  }
}

export const getStatsForIntegration = async (installToken: string): Promise<Stats> => {
  const repos = await getInstalledRepositories(installToken)

  const stats = {
    stars: 0,
    forks: 0,
    totalIssues: 0,
    totalPRs: 0,
  }

  for (const repo of repos) {
    const repoStats = await getStatsForRepo(repo.url, installToken)
    stats.stars += repoStats.stars
    stats.forks += repoStats.forks
    stats.totalIssues += repoStats.totalIssues
    stats.totalPRs += repoStats.totalPRs
  }

  return stats
}
