import { heartbeat } from '@temporalio/activity'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { githubApiGet } from '../../../security-contacts/githubToken'
import { fetchGithubRepoContributors } from '../fetchGithubRepoContributors'

vi.mock('@temporalio/activity', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@temporalio/activity')>()),
  heartbeat: vi.fn(),
}))
vi.mock('../../../config', () => ({ getGithubAppConfig: vi.fn(() => ({ appId: '1' })) }))
vi.mock('../../../security-contacts/githubToken', () => ({ githubApiGet: vi.fn() }))

function contributorsJson(entries: Array<{ login: string; type?: string }>): string {
  return JSON.stringify(entries.map((e) => ({ type: 'User', ...e })))
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('fetchGithubRepoContributors', () => {
  it('returns the lowercased human logins without writing anything', async () => {
    vi.mocked(githubApiGet).mockResolvedValue({
      status: 200,
      text: contributorsJson([
        { login: 'Octo' },
        { login: 'dependabot[bot]', type: 'Bot' },
        { login: 'ada' },
      ]),
    })
    await expect(
      fetchGithubRepoContributors({ repoUrl: 'https://github.com/haskell/aeson' }),
    ).resolves.toEqual({
      status: 'fetched',
      logins: ['octo', 'ada'],
    })
    expect(githubApiGet).toHaveBeenCalledWith(
      expect.stringContaining('/repos/haskell/aeson/contributors'),
      15000,
      { extraOkStatuses: [204] },
    )
  })

  it('returns empty on 204 and when every contributor is a bot', async () => {
    vi.mocked(githubApiGet).mockResolvedValue({ status: 204, text: null })
    await expect(
      fetchGithubRepoContributors({ repoUrl: 'https://github.com/a/b' }),
    ).resolves.toEqual({ status: 'empty', logins: [] })
    vi.mocked(githubApiGet).mockResolvedValue({
      status: 200,
      text: contributorsJson([{ login: 'x[bot]', type: 'Bot' }]),
    })
    await expect(
      fetchGithubRepoContributors({ repoUrl: 'https://github.com/a/b' }),
    ).resolves.toEqual({ status: 'empty', logins: [] })
  })

  it('fails without retry when the repo is missing', async () => {
    vi.mocked(githubApiGet).mockResolvedValue({ status: 404, text: null })
    const error = await fetchGithubRepoContributors({ repoUrl: 'https://github.com/a/b' }).catch(
      (e: unknown) => e,
    )
    expect(error).toMatchObject({ message: 'Repository not found on GitHub', nonRetryable: true })
  })

  it('throws a retryable error when the fetch errors', async () => {
    vi.mocked(githubApiGet).mockRejectedValue(new Error('socket hang up'))
    const error = await fetchGithubRepoContributors({ repoUrl: 'https://github.com/a/b' }).catch(
      (e: unknown) => e,
    )
    expect((error as Error).message).toContain('GitHub contributors fetch failed')
    expect(error).not.toMatchObject({ nonRetryable: true })
  })

  it('heartbeats while the fetch is in flight', async () => {
    vi.useFakeTimers()
    vi.mocked(githubApiGet).mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve({ status: 204, text: null }), 45_000)),
    )
    const pending = fetchGithubRepoContributors({ repoUrl: 'https://github.com/a/b' })
    await vi.advanceTimersByTimeAsync(30_000)
    expect(heartbeat).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(15_000)
    await expect(pending).resolves.toEqual({ status: 'empty', logins: [] })
    expect(vi.getTimerCount()).toBe(0)
  })
})
