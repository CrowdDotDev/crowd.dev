import { beforeEach, describe, expect, it, vi } from 'vitest'

import { switchSyncPipeline } from './switchSyncPipeline'

const activities = vi.hoisted(() => ({
  resolveSwitchTarget: vi.fn(),
  evaluateForwardGate: vi.fn(),
  evaluateBackGate: vi.fn(),
  quiesceUnit: vi.fn(),
  isUnitLocked: vi.fn(),
  activateUnit: vi.fn(),
  pauseNangoRepoSync: vi.fn(),
  resumeNangoRepoSync: vi.fn(),
  setUnitEmitEnabled: vi.fn(),
  replayShadowRecords: vi.fn(),
}))

vi.mock('@temporalio/workflow', () => ({
  proxyActivities: () => activities,
  sleep: vi.fn(() => Promise.resolve()),
  log: { info: vi.fn() },
}))

const target = {
  integrationId: 'int-1',
  connectionId: 'conn-1',
  channelName: 'https://github.com/o/r',
}
const sync = (name: string) => ({ syncName: name, nangoSync: name })
const ok = (syncName: string) => ({ ok: true, unitId: `u-${syncName}` })
const verdict = (outcome: 'refused' | 'unchanged', reason: string, syncName?: string) => ({
  ok: false,
  outcome,
  reason,
  ...(syncName ? { unitId: `u-${syncName}` } : {}),
})

const firstCall = (fn: { mock: { invocationCallOrder: number[] } }) =>
  fn.mock.invocationCallOrder[0]
const lastCall = (fn: { mock: { invocationCallOrder: number[] } }) =>
  fn.mock.invocationCallOrder[fn.mock.invocationCallOrder.length - 1]

describe('switchSyncPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    activities.resolveSwitchTarget.mockResolvedValue({
      target,
      syncs: [sync('issues'), sync('forks')],
    })
    activities.isUnitLocked.mockResolvedValue(false)
    activities.pauseNangoRepoSync.mockResolvedValue(undefined)
    activities.resumeNangoRepoSync.mockResolvedValue(undefined)
    activities.setUnitEmitEnabled.mockResolvedValue(undefined)
    activities.replayShadowRecords.mockResolvedValue(3)
  })

  it('forward: quiesces, drains on the lock, re-gates, pauses nango, flips, replays, reactivates; a failed pause reactivates and never flips', async () => {
    activities.evaluateForwardGate.mockImplementation(async ({ syncName }) => ok(syncName))
    activities.isUnitLocked.mockResolvedValueOnce(true).mockResolvedValue(false)
    activities.pauseNangoRepoSync
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(
        Object.assign(new Error('Activity task failed'), { cause: new Error('nango 503') }),
      )

    const results = await switchSyncPipeline({ owner: 'o', repo: 'r', direction: 'connectors' })

    expect(results).toEqual([
      { syncName: 'issues', outcome: 'switched', reason: '3 shadow records replayed' },
      { syncName: 'forks', outcome: 'refused', reason: 'nango pause failed: nango 503' },
    ])
    const order = [
      activities.quiesceUnit,
      activities.isUnitLocked,
      activities.pauseNangoRepoSync,
      activities.setUnitEmitEnabled,
      activities.replayShadowRecords,
      activities.activateUnit,
    ].map(firstCall)
    expect(order).toEqual([...order].sort((a, b) => a - b))
    expect(activities.evaluateForwardGate).toHaveBeenCalledTimes(4)
    expect(activities.evaluateForwardGate).toHaveBeenCalledWith({ ...target, syncName: 'issues' })
    expect(activities.isUnitLocked).toHaveBeenCalledTimes(3)
    expect(activities.setUnitEmitEnabled).toHaveBeenCalledTimes(1)
    expect(activities.setUnitEmitEnabled).toHaveBeenCalledWith({
      unitId: 'u-issues',
      emitEnabled: true,
    })
    expect(activities.activateUnit.mock.calls).toEqual([
      [{ unitId: 'u-issues' }],
      [{ unitId: 'u-forks' }],
    ])
  })

  it('forward: refusals, a stuck lock, a unit that changed while draining, and an emitting unit that gets healed', async () => {
    activities.resolveSwitchTarget.mockResolvedValue({
      target,
      syncs: [
        sync('issues'),
        { syncName: 'stars', nangoSync: null },
        sync('forks'),
        sync('pull-requests'),
        sync('discussions'),
      ],
    })
    const seen: Record<string, number> = {}
    activities.evaluateForwardGate.mockImplementation(async ({ syncName }) => {
      seen[syncName] = (seen[syncName] ?? 0) + 1
      if (syncName === 'issues') return verdict('refused', 'no diff summary for 2026-10-15')
      if (syncName === 'discussions') return verdict('unchanged', 'already emitting', 'discussions')
      if (syncName === 'pull-requests' && seen[syncName] > 1) {
        return verdict('refused', "unit status is 'dead_letter' (expected active or paused)")
      }
      return ok(syncName)
    })
    activities.isUnitLocked.mockImplementation(async ({ unitId }) => unitId === 'u-forks')

    const results = await switchSyncPipeline({ owner: 'o', repo: 'r', direction: 'connectors' })

    expect(results).toEqual([
      { syncName: 'issues', outcome: 'refused', reason: 'no diff summary for 2026-10-15' },
      { syncName: 'stars', outcome: 'refused', reason: 'unknown github sync' },
      {
        syncName: 'forks',
        outcome: 'refused',
        reason: 'unit still locked after the drain timeout; rerun',
      },
      {
        syncName: 'pull-requests',
        outcome: 'refused',
        reason:
          "unit changed while draining: unit status is 'dead_letter' (expected active or paused)",
      },
      {
        syncName: 'discussions',
        outcome: 'unchanged',
        reason: 'already emitting; 3 shadow records replayed',
      },
    ])
    expect(activities.pauseNangoRepoSync).toHaveBeenCalledTimes(1)
    expect(activities.pauseNangoRepoSync).toHaveBeenCalledWith({
      connectionId: 'conn-1',
      nangoSync: 'discussions',
    })
    expect(activities.setUnitEmitEnabled).not.toHaveBeenCalled()
    expect(activities.replayShadowRecords).toHaveBeenCalledWith({ unitId: 'u-discussions' })
    expect(activities.activateUnit.mock.calls).toEqual([
      [{ unitId: 'u-forks' }],
      [{ unitId: 'u-pull-requests' }],
      [{ unitId: 'u-discussions' }],
    ])
  })

  it('back: flips and reactivates before resuming, and reactivates and resumes a unit that is already off', async () => {
    activities.evaluateBackGate
      .mockResolvedValueOnce(ok('issues'))
      .mockResolvedValueOnce(verdict('unchanged', 'already syncing through nango', 'forks'))

    const results = await switchSyncPipeline({ owner: 'o', repo: 'r', direction: 'nango' })

    expect(results).toEqual([
      { syncName: 'issues', outcome: 'switched' },
      {
        syncName: 'forks',
        outcome: 'unchanged',
        reason: 'already syncing through nango (resume re-sent)',
      },
    ])
    expect(firstCall(activities.setUnitEmitEnabled)).toBeLessThan(
      firstCall(activities.activateUnit),
    )
    expect(lastCall(activities.activateUnit)).toBeLessThan(lastCall(activities.resumeNangoRepoSync))
    expect(activities.setUnitEmitEnabled).toHaveBeenCalledWith({
      unitId: 'u-issues',
      emitEnabled: false,
    })
    expect(activities.activateUnit.mock.calls).toEqual([
      [{ unitId: 'u-issues' }],
      [{ unitId: 'u-forks' }],
    ])
    expect(activities.resumeNangoRepoSync).toHaveBeenCalledTimes(2)
    expect(activities.quiesceUnit).not.toHaveBeenCalled()
  })

  it('refuses every sync when the repo has no active github-nango mapping', async () => {
    activities.resolveSwitchTarget.mockResolvedValue({ target: null, syncs: [sync('issues')] })

    await expect(
      switchSyncPipeline({ owner: 'o', repo: 'r', direction: 'connectors' }),
    ).resolves.toEqual([
      { syncName: 'issues', outcome: 'refused', reason: 'no active github-nango mapping for o/r' },
    ])
    expect(activities.evaluateForwardGate).not.toHaveBeenCalled()
  })
})
