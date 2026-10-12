import { describe, expect, it, vi } from 'vitest'

import { GithubGetResult } from '../../security-contacts/types'
import {
  CONTRIBUTORS_PAGE_SIZE,
  MAX_CONTRIBUTOR_PAGES,
  fetchRepoContributors,
} from '../github/fetchRepoContributors'

const url = 'https://github.com/expressjs/express'

function page(count: number, prefix = 'u'): string {
  return JSON.stringify(
    Array.from({ length: count }, (_, i) => ({ login: `${prefix}${i}`, type: 'User' })),
  )
}

function stubGet(responses: Array<GithubGetResult | Error>) {
  return vi.fn().mockImplementation(async () => {
    const next = responses.shift()
    if (next === undefined) throw new Error('unexpected extra call')
    if (next instanceof Error) throw next
    return next
  })
}

describe('fetchRepoContributors', () => {
  it('pages until a short page and concatenates contributors', async () => {
    const githubGet = stubGet([
      { status: 200, text: page(CONTRIBUTORS_PAGE_SIZE, 'a') },
      { status: 200, text: page(3, 'b') },
    ])
    const result = await fetchRepoContributors(url, githubGet)
    expect(result.status).toBe('fetched')
    expect(result.contributors).toHaveLength(CONTRIBUTORS_PAGE_SIZE + 3)
    expect(githubGet).toHaveBeenNthCalledWith(
      1,
      '/repos/expressjs/express/contributors?per_page=100&page=1',
    )
    expect(githubGet).toHaveBeenNthCalledWith(
      2,
      '/repos/expressjs/express/contributors?per_page=100&page=2',
    )
  })

  it('stops after a single short page', async () => {
    const githubGet = stubGet([{ status: 200, text: page(5) }])
    const result = await fetchRepoContributors(url, githubGet)
    expect(result.status).toBe('fetched')
    expect(githubGet).toHaveBeenCalledTimes(1)
  })

  it('returns empty for 204 and for an empty first page', async () => {
    expect((await fetchRepoContributors(url, stubGet([{ status: 204, text: null }]))).status).toBe(
      'empty',
    )
    expect((await fetchRepoContributors(url, stubGet([{ status: 200, text: '[]' }]))).status).toBe(
      'empty',
    )
  })

  it('returns missing for 404 and 410', async () => {
    expect((await fetchRepoContributors(url, stubGet([{ status: 404, text: null }]))).status).toBe(
      'missing',
    )
    expect((await fetchRepoContributors(url, stubGet([{ status: 410, text: null }]))).status).toBe(
      'missing',
    )
  })

  it('returns private for 451 and error for a thrown HTTP 403', async () => {
    expect((await fetchRepoContributors(url, stubGet([{ status: 451, text: null }]))).status).toBe(
      'private',
    )
    const forbidden = new Error('githubApiGet /repos/x/y/contributors failed: HTTP 403')
    expect((await fetchRepoContributors(url, stubGet([forbidden]))).status).toBe('error')
  })

  it('returns error for 422, other throws, and unparseable bodies', async () => {
    expect((await fetchRepoContributors(url, stubGet([{ status: 422, text: null }]))).status).toBe(
      'error',
    )
    expect((await fetchRepoContributors(url, stubGet([new Error('boom')]))).status).toBe('error')
    expect(
      (await fetchRepoContributors(url, stubGet([{ status: 200, text: '{not json' }]))).status,
    ).toBe('error')
  })

  it('returns error without calling GitHub for a malformed url', async () => {
    const githubGet = stubGet([])
    const result = await fetchRepoContributors('https://gitlab.com/a/b', githubGet)
    expect(result.status).toBe('error')
    expect(githubGet).not.toHaveBeenCalled()
  })

  it('returns error when the page cap is reached', async () => {
    const githubGet = stubGet(
      Array.from({ length: MAX_CONTRIBUTOR_PAGES }, () => ({
        status: 200,
        text: page(CONTRIBUTORS_PAGE_SIZE),
      })),
    )
    const result = await fetchRepoContributors(url, githubGet)
    expect(result.status).toBe('error')
    expect(githubGet).toHaveBeenCalledTimes(MAX_CONTRIBUTOR_PAGES)
  })
})
