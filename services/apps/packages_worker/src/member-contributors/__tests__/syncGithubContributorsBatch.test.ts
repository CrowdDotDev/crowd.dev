import { heartbeat } from '@temporalio/activity'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'

import { getPackagesDb } from '../../db'
import { githubApiGet } from '../../security-contacts/githubToken'
import { addGithubSyncCounts, emptyGithubSyncCounts } from '../github/counts'
import {
  syncGithubContributorsBatch,
  upsertGithubContributorRows,
} from '../github/syncGithubContributorsBatch'

vi.mock('@temporalio/activity', () => ({ heartbeat: vi.fn() }))
vi.mock('../../config', () => ({ getGithubAppConfig: vi.fn(() => ({ appId: '1' })) }))
vi.mock('../../db', () => ({ getPackagesDb: vi.fn() }))
vi.mock('../../security-contacts/githubToken', () => ({ githubApiGet: vi.fn() }))

const runStartedAt = '2026-10-18T07:00:00.000Z'
const batchStart = new Date('2026-10-18T07:05:00Z')

function contributorsJson(logins: string[]): string {
  return JSON.stringify(logins.map((login) => ({ login, type: 'User' })))
}

function stubQx(repos: Array<{ id: string; url: string }>, checkedRepos = '0') {
  const select = vi.fn().mockImplementation(async (sql: string) => {
    if (sql.includes('"nowMs"')) return [{ nowMs: batchStart.getTime() }]
    if (sql.includes('"checkedRepos"')) return [{ checkedRepos }]
    return repos
  })
  const result = vi
    .fn()
    .mockImplementation(async (sql: string) => (sql.startsWith('DELETE') ? 2 : 1))
  const qx = { select, result } as unknown as QueryExecutor & { tx: unknown }
  ;(qx as { tx: unknown }).tx = vi.fn(async (fn: (t: QueryExecutor) => Promise<void>) => fn(qx))
  vi.mocked(getPackagesDb).mockResolvedValue(qx as unknown as QueryExecutor)
  return { select, result }
}

function stubGithub(byPath: Record<string, { status: number; text: string | null } | Error>) {
  vi.mocked(githubApiGet).mockImplementation(async (path: string) => {
    const owner = path.split('/')[2]
    const response = byPath[owner]
    if (response === undefined) throw new Error(`no stub for ${path}`)
    if (response instanceof Error) throw response
    return response
  })
}

function sqlCalls(fn: ReturnType<typeof vi.fn>, prefix: string): string[] {
  return fn.mock.calls.map((c) => String(c[0]).trim()).filter((sql) => sql.startsWith(prefix))
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('syncGithubContributorsBatch', () => {
  it('selects only critical github repos not covered by git activity', async () => {
    const { select } = stubQx([], '5')
    await syncGithubContributorsBatch({ runStartedAt, limit: 500 })
    const selection = sqlCalls(select, 'SELECT').find((sql) => sql.includes('FROM repos r'))
    expect(selection).toContain("r.host = 'github'")
    expect(selection).toContain('p.is_critical')
    expect(selection).toContain("rc.source = 'git_activity'")
    expect(selection).toContain('github_contributors_checked_at')
    expect(selection).toContain('ORDER BY r.github_contributors_checked_at NULLS FIRST, r.id')
    expect(selection).not.toContain('r.id >')
  })

  it('upserts rows, removes stale rows, and marks fetched repos', async () => {
    const { select, result } = stubQx([{ id: '1', url: 'https://github.com/alpha/repo' }])
    stubGithub({ alpha: { status: 200, text: contributorsJson(['Jane', 'bob']) } })

    const out = await syncGithubContributorsBatch({ runStartedAt, limit: 500 })

    expect(out.counts).toEqual({
      selected: 1,
      fetched: 1,
      upserted: 1,
      removed: 2,
      skipped: { missing: 0, empty: 0, error: 0 },
    })
    const inserts = sqlCalls(result, 'INSERT INTO "repo_contributors"')
    expect(inserts).toHaveLength(1)
    expect(inserts[0]).toContain("'jane'")
    expect(inserts[0]).toContain("'bob'")
    expect(inserts[0]).not.toContain("'Jane'")
    const deletes = sqlCalls(result, 'DELETE FROM repo_contributors')
    expect(deletes).toHaveLength(1)
    expect(deletes[0]).toContain("source = 'github'")
    expect(deletes[0]).toContain('updated_at < $(batchStartedAt)')
    const updates = sqlCalls(result, 'UPDATE repos')
    expect(updates).toHaveLength(1)
    expect(
      result.mock.calls.find((c) => String(c[0]).trim().startsWith('UPDATE'))?.[1],
    ).toMatchObject({
      repoIds: ['1'],
      status: 'fetched',
    })
    expect(select).toHaveBeenCalled()
  })

  it('marks empty repos, deletes their rows, and inserts nothing', async () => {
    const { result } = stubQx([{ id: '2', url: 'https://github.com/beta/repo' }])
    stubGithub({ beta: { status: 204, text: null } })

    const out = await syncGithubContributorsBatch({ runStartedAt, limit: 500 })

    expect(out.counts.skipped.empty).toBe(1)
    expect(sqlCalls(result, 'INSERT')).toHaveLength(0)
    expect(sqlCalls(result, 'DELETE FROM repo_contributors')).toHaveLength(1)
    expect(
      result.mock.calls.find((c) => String(c[0]).trim().startsWith('UPDATE'))?.[1],
    ).toMatchObject({
      repoIds: ['2'],
      status: 'empty',
    })
  })

  it('marks error repos without deleting their rows and keeps the batch alive', async () => {
    const { result } = stubQx([
      { id: '3', url: 'https://github.com/gamma/repo' },
      { id: '4', url: 'https://github.com/delta/repo' },
    ])
    stubGithub({
      gamma: new Error('socket hang up'),
      delta: { status: 200, text: contributorsJson(['x']) },
    })

    const out = await syncGithubContributorsBatch({ runStartedAt, limit: 500 })

    expect(out.counts.fetched).toBe(1)
    expect(out.counts.skipped.error).toBe(1)
    const deleteParams = result.mock.calls
      .filter((c) => String(c[0]).trim().startsWith('DELETE'))
      .map((c) => c[1] as { repoIds: string[] })
    expect(deleteParams).toEqual([{ repoIds: ['4'], batchStartedAt: batchStart }])
    const statusParams = result.mock.calls
      .filter((c) => String(c[0]).trim().startsWith('UPDATE'))
      .map((c) => c[1] as { repoIds: string[]; status: string })
    expect(statusParams).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ repoIds: ['3'], status: 'error' }),
        expect.objectContaining({ repoIds: ['4'], status: 'fetched' }),
      ]),
    )
  })

  it('marks missing repos as skipped and a thrown 403 as error', async () => {
    stubQx([
      { id: '5', url: 'https://github.com/eps/repo' },
      { id: '6', url: 'https://github.com/zeta/repo' },
    ])
    stubGithub({
      eps: { status: 404, text: null },
      zeta: new Error('githubApiGet /repos/zeta/repo/contributors failed: HTTP 403'),
    })

    const out = await syncGithubContributorsBatch({ runStartedAt, limit: 500 })

    expect(out.counts.skipped).toEqual({ missing: 1, empty: 0, error: 1 })
    expect(out.counts.upserted).toBe(0)
  })

  it('asks the token pool to treat 204 as an ok status', async () => {
    stubQx([{ id: '7', url: 'https://github.com/eta/repo' }])
    stubGithub({ eta: { status: 204, text: null } })

    await syncGithubContributorsBatch({ runStartedAt, limit: 500 })

    expect(githubApiGet).toHaveBeenCalledWith(expect.any(String), 15000, { extraOkStatuses: [204] })
  })

  it('returns selected 0 when nothing is eligible and some repo was checked before', async () => {
    stubQx([], '5')
    const out = await syncGithubContributorsBatch({ runStartedAt, limit: 500 })
    expect(out.counts.selected).toBe(0)
  })

  it('throws when the first page is empty and no repo was ever checked', async () => {
    stubQx([], '0')
    await expect(syncGithubContributorsBatch({ runStartedAt, limit: 500 })).rejects.toThrow(
      'selected 0 repos',
    )
  })

  it('refuses to write anything when every repo of a large batch fails', async () => {
    const repos = Array.from({ length: 20 }, (_, i) => ({
      id: String(100 + i),
      url: `https://github.com/owner${i}/repo`,
    }))
    const { result } = stubQx(repos)
    vi.mocked(githubApiGet).mockRejectedValue(new Error('socket hang up'))
    const qx = await getPackagesDb()

    await expect(syncGithubContributorsBatch({ runStartedAt, limit: 500 })).rejects.toThrow(
      'all 20 repos failed',
    )
    expect((qx as unknown as { tx: ReturnType<typeof vi.fn> }).tx).not.toHaveBeenCalled()
    expect(result).not.toHaveBeenCalled()
  })

  it('heartbeats on a timer while fetches are in flight and clears the timer', async () => {
    vi.useFakeTimers()
    stubQx([{ id: '8', url: 'https://github.com/theta/repo' }])
    vi.mocked(githubApiGet).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ status: 200, text: contributorsJson(['x']) }), 45_000)
        }),
    )

    const pending = syncGithubContributorsBatch({ runStartedAt, limit: 500 })
    await vi.advanceTimersByTimeAsync(30_000)
    expect(heartbeat).toHaveBeenCalledWith({ done: 0, selected: 1 })

    await vi.advanceTimersByTimeAsync(15_000)
    const out = await pending
    expect(out.counts.fetched).toBe(1)
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('addGithubSyncCounts', () => {
  it('adds every counter including skipped', () => {
    const a = emptyGithubSyncCounts()
    a.selected = 2
    a.skipped.error = 1
    const b = emptyGithubSyncCounts()
    b.selected = 3
    b.fetched = 1
    b.skipped.error = 2
    expect(addGithubSyncCounts(a, b)).toEqual({
      selected: 5,
      fetched: 1,
      upserted: 0,
      removed: 0,
      skipped: { missing: 0, empty: 0, error: 3 },
    })
  })
})

describe('upsertGithubContributorRows', () => {
  it('splits rows into chunks of the given size and sums the results', async () => {
    const result = vi.fn().mockResolvedValue(2)
    const tx = { result } as unknown as QueryExecutor
    const observedAt = new Date(runStartedAt)
    const rows = ['a', 'b', 'c', 'd', 'e'].map((login) => ({
      repoId: '1',
      source: 'github',
      role: 'commit-author',
      roleKind: 'contributor',
      identityType: 'github-login' as const,
      identityValue: login,
      firstSeenAt: observedAt,
      lastSeenAt: observedAt,
      endedAt: null,
    }))

    const upserted = await upsertGithubContributorRows(tx, rows, 2)

    expect(result).toHaveBeenCalledTimes(3)
    expect(upserted).toBe(6)
    expect(String(result.mock.calls[2][0])).toContain("'e'")
    expect(String(result.mock.calls[2][0])).not.toContain("'d'")
  })

  it('issues no statement for zero rows', async () => {
    const result = vi.fn()
    await upsertGithubContributorRows({ result } as unknown as QueryExecutor, [])
    expect(result).not.toHaveBeenCalled()
  })
})
