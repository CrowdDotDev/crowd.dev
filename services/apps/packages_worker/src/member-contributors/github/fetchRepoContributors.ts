import { getServiceChildLogger } from '@crowd/logging'

import { parseGithubUrl } from '../../enricher/fetchLightRepo'
import { GithubGetResult } from '../../security-contacts/types'
import { GithubContributor, GithubContributorsStatus } from './mapContributors'

const log = getServiceChildLogger('fetchRepoContributors')

export const CONTRIBUTORS_PAGE_SIZE = 100
export const MAX_CONTRIBUTOR_PAGES = 100

export type GithubGet = (path: string) => Promise<GithubGetResult>

export interface RepoContributorsFetch {
  status: GithubContributorsStatus
  contributors: GithubContributor[]
}

const EMPTY_REPO_STATUS = 204
const STATUS_BY_ABSENT_CODE: Record<number, GithubContributorsStatus> = {
  404: 'missing',
  410: 'missing',
  451: 'private',
  422: 'error',
}

function withStatus(status: GithubContributorsStatus): RepoContributorsFetch {
  return { status, contributors: [] }
}

function parsePage(text: string): GithubContributor[] | null {
  const parsed: unknown = JSON.parse(text)
  return Array.isArray(parsed) ? (parsed as GithubContributor[]) : null
}

function contributorsPath(owner: string, name: string, page: number): string {
  return `/repos/${owner}/${name}/contributors?per_page=${CONTRIBUTORS_PAGE_SIZE}&page=${page}`
}

export async function fetchRepoContributors(
  repoUrl: string,
  githubGet: GithubGet,
): Promise<RepoContributorsFetch> {
  let owner: string
  let name: string
  try {
    ;({ owner, name } = parseGithubUrl(repoUrl))
  } catch (err) {
    log.warn({ repoUrl, errMsg: (err as Error).message }, 'Unparseable GitHub repo url')
    return withStatus('error')
  }

  const contributors: GithubContributor[] = []
  for (let page = 1; page <= MAX_CONTRIBUTOR_PAGES; page++) {
    let result: GithubGetResult
    try {
      result = await githubGet(contributorsPath(owner, name, page))
    } catch (err) {
      log.warn(
        { owner, repo: name, page, errMsg: (err as Error).message },
        'Contributors fetch failed',
      )
      return withStatus('error')
    }

    if (result.status === EMPTY_REPO_STATUS) return withStatus('empty')
    if (result.status !== 200 || result.text === null) {
      return withStatus(STATUS_BY_ABSENT_CODE[result.status] ?? 'error')
    }

    let pageContributors: GithubContributor[] | null
    try {
      pageContributors = parsePage(result.text)
    } catch {
      pageContributors = null
    }
    if (pageContributors === null) {
      log.warn({ owner, repo: name, page }, 'Contributors page is not a JSON array')
      return withStatus('error')
    }

    contributors.push(...pageContributors)
    if (pageContributors.length < CONTRIBUTORS_PAGE_SIZE) {
      return { status: contributors.length === 0 ? 'empty' : 'fetched', contributors }
    }
  }

  log.warn({ owner, repo: name, pages: MAX_CONTRIBUTOR_PAGES }, 'Contributors page cap reached')
  return withStatus('error')
}
