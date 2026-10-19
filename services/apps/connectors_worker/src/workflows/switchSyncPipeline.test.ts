import { beforeEach, describe, expect, it, vi } from 'vitest'

import { switchSyncPipeline } from './switchSyncPipeline'

const activities = vi.hoisted(() => ({
  resolveSwitchTarget: vi.fn(),
  evaluateForwardGate: vi.fn(),
  evaluateBackGate: vi.fn(),
  quiesceUnit: vi.fn(),
  isUnitRunning: vi.fn(),
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
const issues = { syncName: 'issues', nangoSync: 'issues' }
const forks = { syncName: 'forks', nangoSync: 'forks' }

const firstCall = (fn: { mock: { invocationCallOrder: number[] } }) =>
  fn.mock.invocationCallOrder[0]
const lastCall = (fn: { mock: { invocationCallOrder: number[] } }) =>
  fn.mock.invocationCallOrder.at(-1)

describe('switchSyncPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    activities.resolveSwitchTarget.mockResolvedValue({ target, syncs: [issues, forks] })
    activities.isUnitRunning.mockResolvedValue(false)
    activities.pauseNangoRepoSync.mockResolvedValue(undefined)
    activities.resumeNangoRepoSync.mockResolvedValue(undefined)
    activities.setUnitEmitEnabled.mockResolvedValue(undefined)
    activities.replayShadowRecords.mockResolvedValue(3)
  })

  it('forward: drains, pauses nango, flips, replays, reactivates in that order; a failed pause reactivates and never flips', async () => {
    activities.evaluateForwardGate
      .mockResolvedValueOnce({ ok: true, unitId: 'u-issues' })
      .mockResolvedValueOnce({ ok: true, unitId: 'u-forks' })
    activities.isUnitRunning.mockResolvedValueOnce(true).mockResolvedValue(false)
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
      activities.isUnitRunning,
      activities.pauseNangoRepoSync,
      activities.setUnitEmitEnabled,
      activities.replayShadowRecords,
      activities.activateUnit,
    ].map(firstCall)
    expect(order).toEqual([...order].sort((a, b) => a - b))
    expect(activities.isUnitRunning).toHaveBeenCalledTimes(3)
    expect(activities.setUnitEmitEnabled).toHaveBeenCalledTimes(1)
    expect(activities.setUnitEmitEnabled).toHaveBeenCalledWith({
      unitId: 'u-issues',
      emitEnabled: true,
    })
    expect(activities.activateUnit).toHaveBeenCalledTimes(2)
    expect(activities.activateUnit).toHaveBeenLastCalledWith({ unitId: 'u-forks' })
  })

  it('forward: refusals never touch nango, a unit stuck running is reactivated and refused, an emitting unit is healed', async () => {
    activities.resolveSwitchTarget.mockResolvedValue({
      target,
      syncs: [
        issues,
        { syncName: 'stars', nangoSync: null },
        forks,
        { syncName: 'discussions', nangoSync: 'discussions' },
      ],
    })
    activities.evaluateForwardGate
      .mockResolvedValueOnce({
        ok: false,
        outcome: 'refused',
        reason: 'no diff summary for 2026-10-15',
      })
      .mockResolvedValueOnce({ ok: true, unitId: 'u-forks' })
      .mockResolvedValueOnce({ ok: false, outcome: 'unchanged', reason: 'already emitting' })
    activities.evaluateBackGate.mockResolvedValue({ ok: true, unitId: 'u-discussions' })
    activities.isUnitRunning.mockResolvedValue(true)

    const results = await switchSyncPipeline({ owner: 'o', repo: 'r', direction: 'connectors' })

    expect(results).toEqual([
      { syncName: 'issues', outcome: 'refused', reason: 'no diff summary for 2026-10-15' },
      { syncName: 'stars', outcome: 'refused', reason: 'unknown github sync' },
      {
        syncName: 'forks',
        outcome: 'refused',
        reason: 'unit still running after the drain timeout; rerun',
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
      [{ unitId: 'u-discussions' }],
    ])
  })

  it('back: flips and reactivates before resuming, and still resumes a unit that is already off', async () => {
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
    expect(firstCall(activities.setUnitEmitEnabled)).toBeLessThan(
      firstCall(activities.activateUnit),
    )
    expect(lastCall(activities.activateUnit)).toBeLessThan(
      firstCall(activities.resumeNangoRepoSync),
    )
    expect(activities.setUnitEmitEnabled).toHaveBeenCalledWith({
      unitId: 'u-issues',
      emitEnabled: false,
    })
    expect(activities.resumeNangoRepoSync).toHaveBeenCalledTimes(2)
    expect(activities.quiesceUnit).not.toHaveBeenCalled()
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
