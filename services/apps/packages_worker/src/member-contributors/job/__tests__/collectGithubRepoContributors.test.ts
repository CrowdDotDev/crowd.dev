import { beforeEach, describe, expect, it, vi } from 'vitest'

import { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'

import { getPackagesDb } from '../../../db'
import { githubApiGet } from '../../../security-contacts/githubToken'
import { collectGithubRepoContributors } from '../collectGithubRepoContributors'

vi.mock('../../../config', () => ({ getGithubAppConfig: vi.fn(() => ({ appId: '1' })) }))
vi.mock('../../../db', () => ({ getPackagesDb: vi.fn() }))
vi.mock('../../../security-contacts/githubToken', () => ({ githubApiGet: vi.fn() }))

const batchStart = new Date('2026-10-15T10:00:00Z')
const repo = { repoId: '590455', repoUrl: 'https://github.com/a/request-oauth' }

function contributorsJson(entries: Array<{ login: string; type?: string }>): string {
  return JSON.stringify(entries.map((e) => ({ type: 'User', ...e })))
}

function stubQx() {
  const select = vi.fn().mockResolvedValue([{ nowMs: batchStart.getTime() }])
  const result = vi
    .fn()
    .mockImplementation(async (sql: string) => (sql.startsWith('DELETE') ? 1 : 2))
  const qx = { select, result } as unknown as QueryExecutor & { tx: unknown }
  ;(qx as { tx: unknown }).tx = vi.fn(async (fn: (t: QueryExecutor) => Promise<void>) => fn(qx))
  vi.mocked(getPackagesDb).mockResolvedValue(qx as unknown as QueryExecutor)
  return { select, result, tx: (qx as { tx: ReturnType<typeof vi.fn> }).tx }
}

function sqlCalls(fn: ReturnType<typeof vi.fn>, prefix: string): string[] {
  return fn.mock.calls.map((c) => String(c[0]).trim()).filter((sql) => sql.startsWith(prefix))
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('collectGithubRepoContributors', () => {
  it('writes the fetched rows, marks the repo fetched and returns the lowercased logins', async () => {
    const { result } = stubQx()
    vi.mocked(githubApiGet).mockResolvedValue({
      status: 200,
      text: contributorsJson([
        { login: 'Octo' },
        { login: 'dependabot[bot]', type: 'Bot' },
        { login: 'ada' },
      ]),
    })

    const out = await collectGithubRepoContributors(repo)

    expect(out).toEqual({ status: 'fetched', logins: ['octo', 'ada'] })
    expect(githubApiGet).toHaveBeenCalledWith(
      expect.stringContaining('/repos/a/request-oauth/contributors'),
      15000,
      { extraOkStatuses: [204] },
    )
    expect(sqlCalls(result, 'INSERT INTO "repo_contributors"')).toHaveLength(1)
    expect(sqlCalls(result, 'DELETE FROM repo_contributors')).toHaveLength(1)
    const update = result.mock.calls.find((c) => String(c[0]).trim().startsWith('UPDATE repos'))
    expect(update?.[1]).toMatchObject({
      repoIds: ['590455'],
      status: 'fetched',
      checkedAt: batchStart,
    })
  })

  it('completes with no logins and marks the repo empty on 204', async () => {
    const { result } = stubQx()
    vi.mocked(githubApiGet).mockResolvedValue({ status: 204, text: null })

    const out = await collectGithubRepoContributors(repo)

    expect(out).toEqual({ status: 'empty', logins: [] })
    expect(sqlCalls(result, 'INSERT')).toHaveLength(0)
    const update = result.mock.calls.find((c) => String(c[0]).trim().startsWith('UPDATE repos'))
    expect(update?.[1]).toMatchObject({ status: 'empty' })
  })

  it('completes with no logins when every contributor is a bot', async () => {
    stubQx()
    vi.mocked(githubApiGet).mockResolvedValue({
      status: 200,
      text: contributorsJson([{ login: 'renovate[bot]', type: 'Bot' }]),
    })
    await expect(collectGithubRepoContributors(repo)).resolves.toEqual({
      status: 'empty',
      logins: [],
    })
  })

  it('fails without retry and writes nothing when the repo is missing on GitHub', async () => {
    const { tx } = stubQx()
    vi.mocked(githubApiGet).mockResolvedValue({ status: 404, text: null })

    const error = await collectGithubRepoContributors(repo).catch((e: unknown) => e)

    expect(error).toMatchObject({ message: 'Repository not found on GitHub', nonRetryable: true })
    expect(tx).not.toHaveBeenCalled()
  })

  it('throws a retryable error and writes nothing when the fetch errors', async () => {
    const { tx } = stubQx()
    vi.mocked(githubApiGet).mockRejectedValue(new Error('socket hang up'))

    const error = await collectGithubRepoContributors(repo).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toContain('GitHub contributors fetch failed')
    expect(error).not.toMatchObject({ nonRetryable: true })
    expect(tx).not.toHaveBeenCalled()
  })
})
