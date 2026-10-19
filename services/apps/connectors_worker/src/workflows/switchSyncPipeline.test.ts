import { beforeEach, describe, expect, it, vi } from 'vitest'

import { switchSyncPipeline } from './switchSyncPipeline'

const activities = vi.hoisted(() => ({
  resolveSwitchTarget: vi.fn(),
  evaluateForwardGate: vi.fn(),
  evaluateBackGate: vi.fn(),
  pauseNangoRepoSync: vi.fn(),
  resumeNangoRepoSync: vi.fn(),
  setUnitEmitEnabled: vi.fn(),
}))

vi.mock('@temporalio/workflow', () => ({
  proxyActivities: () => activities,
  log: { info: vi.fn() },
}))

const target = {
  integrationId: 'int-1',
  connectionId: 'conn-1',
  channelName: 'https://github.com/o/r',
}
const issues = { syncName: 'issues', nangoSync: 'issues' }
const forks = { syncName: 'forks', nangoSync: 'forks' }

const callOrder = (fn: { mock: { invocationCallOrder: number[] } }) =>
  fn.mock.invocationCallOrder[0]

describe('switchSyncPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    activities.resolveSwitchTarget.mockResolvedValue({ target, syncs: [issues, forks] })
    activities.pauseNangoRepoSync.mockResolvedValue(undefined)
    activities.resumeNangoRepoSync.mockResolvedValue(undefined)
    activities.setUnitEmitEnabled.mockResolvedValue(undefined)
  })

  it('forward: pauses nango before flipping, and a failed pause never flips', async () => {
    activities.evaluateForwardGate
      .mockResolvedValueOnce({ ok: true, unitId: 'u-issues' })
      .mockResolvedValueOnce({ ok: true, unitId: 'u-forks' })
    activities.pauseNangoRepoSync
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(
        Object.assign(new Error('Activity task failed'), { cause: new Error('nango 503') }),
      )

    const results = await switchSyncPipeline({ owner: 'o', repo: 'r', direction: 'connectors' })

    expect(results).toEqual([
      { syncName: 'issues', outcome: 'switched' },
      { syncName: 'forks', outcome: 'refused', reason: 'nango pause failed: nango 503' },
    ])
    expect(callOrder(activities.pauseNangoRepoSync)).toBeLessThan(
      callOrder(activities.setUnitEmitEnabled),
    )
    expect(activities.pauseNangoRepoSync).toHaveBeenCalledWith({
      connectionId: 'conn-1',
      nangoSync: 'issues',
    })
    expect(activities.setUnitEmitEnabled).toHaveBeenCalledTimes(1)
    expect(activities.setUnitEmitEnabled).toHaveBeenCalledWith({
      unitId: 'u-issues',
      emitEnabled: true,
    })
  })

  it('forward: reports gate verdicts and unmapped syncs without touching nango', async () => {
    activities.resolveSwitchTarget.mockResolvedValue({
      target,
      syncs: [issues, { syncName: 'stars', nangoSync: null }],
    })
    activities.evaluateForwardGate.mockResolvedValue({
      ok: false,
      outcome: 'refused',
      reason: 'no diff summary for 2026-10-15',
    })

    const results = await switchSyncPipeline({ owner: 'o', repo: 'r', direction: 'connectors' })

    expect(results).toEqual([
      { syncName: 'issues', outcome: 'refused', reason: 'no diff summary for 2026-10-15' },
      { syncName: 'stars', outcome: 'refused', reason: 'unknown github sync' },
    ])
    expect(activities.pauseNangoRepoSync).not.toHaveBeenCalled()
  })

  it('back: flips before resuming, and still resumes a unit that is already off', async () => {
    activities.evaluateBackGate
      .mockResolvedValueOnce({ ok: true, unitId: 'u-issues' })
      .mockResolvedValueOnce({
        ok: false,
        outcome: 'unchanged',
        reason: 'already syncing through nango',
      })

    const results = await switchSyncPipeline({ owner: 'o', repo: 'r', direction: 'nango' })

    expect(results).toEqual([
      { syncName: 'issues', outcome: 'switched' },
      {
        syncName: 'forks',
        outcome: 'unchanged',
        reason: 'already syncing through nango (resume re-sent)',
      },
    ])
    expect(callOrder(activities.setUnitEmitEnabled)).toBeLessThan(
      callOrder(activities.resumeNangoRepoSync),
    )
    expect(activities.setUnitEmitEnabled).toHaveBeenCalledWith({
      unitId: 'u-issues',
      emitEnabled: false,
    })
    expect(activities.resumeNangoRepoSync).toHaveBeenCalledTimes(2)
  })

  it('refuses every sync when the repo has no active github-nango mapping', async () => {
    activities.resolveSwitchTarget.mockResolvedValue({ target: null, syncs: [issues] })

    await expect(
      switchSyncPipeline({ owner: 'o', repo: 'r', direction: 'connectors' }),
    ).resolves.toEqual([
      { syncName: 'issues', outcome: 'refused', reason: 'no active github-nango mapping for o/r' },
    ])
    expect(activities.evaluateForwardGate).not.toHaveBeenCalled()
  })
})
