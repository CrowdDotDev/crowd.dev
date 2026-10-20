import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { IMirrorCandidate } from '../mirrorSweep'
import { mirrorRepos, selectMirrorBatch } from './mirrorSweepActivities'

const mocks = vi.hoisted(() => ({
  listUnmirroredNangoRepos: vi.fn(),
  countShadowRepos: vi.fn(),
  executeSql: vi.fn(),
  mirrorRepo: vi.fn(),
  initNangoCloudClient: vi.fn(),
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('../main', () => ({
  svc: {
    postgres: { writer: {} },
    log: mocks.log,
  },
}))
vi.mock('@crowd/data-access-layer/src/queryExecutor', () => ({ dbStoreQx: vi.fn(() => 'qx') }))
vi.mock('@crowd/data-access-layer/src/connectors', () => ({
  countShadowRepos: mocks.countShadowRepos,
}))
vi.mock('@crowd/data-access-layer/src/integrations', () => ({
  listUnmirroredNangoRepos: mocks.listUnmirroredNangoRepos,
}))
vi.mock('@crowd/database', () => ({
  TinybirdClient: class {
    executeSql = mocks.executeSql
  },
}))
vi.mock('../mirrorRepo', () => ({ mirrorRepo: mocks.mirrorRepo }))
vi.mock('@crowd/nango', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@crowd/nango')>()),
  initNangoCloudClient: mocks.initNangoCloudClient,
}))

const repo = (repoName: string) => ({
  integrationId: 'int-1',
  connectionId: 'conn-1',
  owner: 'acme',
  repoName,
  enabled: true,
  archived: false,
  excluded: false,
})

const candidate = (repoName: string): IMirrorCandidate => ({
  integrationId: 'int-1',
  connectionId: 'conn-1',
  owner: 'acme',
  repoName,
})

describe('mirror sweep activities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ now: new Date('2026-10-20T10:00:00Z'), toFake: ['Date'] })
  })
  afterEach(() => vi.useRealTimers())

  it('selects the most active candidates up to the limit and lets tinybird errors fail the batch', async () => {
    mocks.listUnmirroredNangoRepos.mockResolvedValue([repo('c'), repo('a'), repo('b')])
    mocks.executeSql.mockResolvedValue({
      data: [
        { channelKey: 'https://github.com/acme/b', activities: 50 },
        { channelKey: 'https://github.com/acme/a', activities: 10 },
      ],
    })

    await expect(selectMirrorBatch(2)).resolves.toEqual({
      since: '2026-10-18T00:00:00.000Z',
      candidatesTotal: 3,
      batch: [candidate('b'), candidate('a')],
    })

    vi.clearAllMocks()
    mocks.listUnmirroredNangoRepos.mockResolvedValue([repo('a')])
    mocks.executeSql.mockRejectedValue(new Error('tinybird down'))

    await expect(selectMirrorBatch(2)).rejects.toThrow('tinybird down')
    expect(mocks.listUnmirroredNangoRepos).toHaveBeenCalledTimes(1)
    expect(mocks.countShadowRepos).not.toHaveBeenCalled()
  })

  it('mirrors the batch at most five repos at a time and logs every skip', async () => {
    let inFlight = 0
    let peak = 0
    mocks.mirrorRepo.mockImplementation(async (_qx: unknown, c: IMirrorCandidate) => {
      inFlight++
      peak = Math.max(peak, inFlight)
      await Promise.resolve()
      inFlight--
      return ['r2', 'r5'].includes(c.repoName)
        ? { outcome: 'skipped', reason: 'repo_not_found', message: '404' }
        : { outcome: 'mirrored', unitsInserted: 8 }
    })
    const batch = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'].map(candidate)

    await expect(mirrorRepos(batch, '2026-10-18T00:00:00.000Z')).resolves.toEqual({
      mirrored: 5,
      skipped: 2,
      unitsInserted: 40,
    })

    expect(peak).toBe(5)
    expect(mocks.initNangoCloudClient).toHaveBeenCalledTimes(1)
    expect(mocks.mirrorRepo).toHaveBeenCalledWith('qx', batch[0], '2026-10-18T00:00:00.000Z')
    expect(mocks.log.warn).toHaveBeenCalledTimes(2)
    expect(mocks.log.warn).toHaveBeenCalledWith(
      {
        event: 'mirror_repo_skipped',
        integrationId: 'int-1',
        owner: 'acme',
        repoName: 'r2',
        reason: 'repo_not_found',
        message: '404',
      },
      'repo skipped by mirror sweep',
    )
  })
})
