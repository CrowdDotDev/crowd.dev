import { beforeEach, describe, expect, it, vi } from 'vitest'

import { mirrorSweep } from './mirrorSweep'

const mocks = vi.hoisted(() => ({
  countShadowRepos: vi.fn(),
  selectMirrorBatch: vi.fn(),
  mirrorRepos: vi.fn(),
  logMirrorSweepSummary: vi.fn(),
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('@temporalio/workflow', () => ({
  proxyActivities: () => ({
    countShadowRepos: mocks.countShadowRepos,
    selectMirrorBatch: mocks.selectMirrorBatch,
    mirrorRepos: mocks.mirrorRepos,
    logMirrorSweepSummary: mocks.logMirrorSweepSummary,
  }),
  log: mocks.log,
  ApplicationFailure: { nonRetryable: (message: string) => new Error(message) },
}))

const candidates = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    integrationId: 'i',
    connectionId: `c-${i}`,
    owner: 'o',
    repoName: `r-${i}`,
  }))

describe('mirrorSweep', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mirrors in sequential chunks of 100, stops at the first failed chunk and still logs the summary', async () => {
    const batch = candidates(250)
    mocks.countShadowRepos.mockResolvedValue(110)
    mocks.selectMirrorBatch.mockResolvedValue({
      since: '2026-10-18T00:00:00.000Z',
      candidatesTotal: 900,
      batch,
    })
    mocks.mirrorRepos
      .mockResolvedValueOnce({ mirrored: 90, skipped: 10, unitsInserted: 800 })
      .mockRejectedValueOnce(new Error('chunk timed out'))

    const summary = await mirrorSweep({ batchSize: 500, shadowCap: 5000 })

    expect(mocks.selectMirrorBatch).toHaveBeenCalledWith(500)
    expect(mocks.mirrorRepos.mock.calls.map(([repos, since]) => [repos.length, since])).toEqual([
      [100, '2026-10-18T00:00:00.000Z'],
      [100, '2026-10-18T00:00:00.000Z'],
    ])
    expect(summary).toMatchObject({
      batchSize: 500,
      shadowCap: 5000,
      inShadow: 110,
      candidates: 900,
      attempted: 100,
      mirrored: 90,
      skipped: 10,
      unitsInserted: 800,
      chunksFailed: 1,
    })
    expect(mocks.logMirrorSweepSummary).toHaveBeenCalledTimes(1)
    expect(mocks.logMirrorSweepSummary).toHaveBeenCalledWith(summary)
  })

  it('does not select or mirror anything when the shadow pool is full, but still logs the summary', async () => {
    mocks.countShadowRepos.mockResolvedValue(5000)

    const summary = await mirrorSweep({ batchSize: 500, shadowCap: 5000 })

    expect(mocks.selectMirrorBatch).not.toHaveBeenCalled()
    expect(mocks.mirrorRepos).not.toHaveBeenCalled()
    expect(summary).toMatchObject({ inShadow: 5000, candidates: 0, attempted: 0, chunksFailed: 0 })
    expect(mocks.logMirrorSweepSummary).toHaveBeenCalledWith(summary)

    vi.clearAllMocks()
    await expect(mirrorSweep({ batchSize: 0, shadowCap: 5000 })).rejects.toThrow('batchSize')
    await expect(mirrorSweep({ shadowCap: 5000 } as never)).rejects.toThrow('batchSize')
    await expect(mirrorSweep({ batchSize: 600, shadowCap: 500 })).rejects.toThrow('shadowCap')
    expect(mocks.countShadowRepos).not.toHaveBeenCalled()
    expect(mocks.logMirrorSweepSummary).not.toHaveBeenCalled()
  })
})
