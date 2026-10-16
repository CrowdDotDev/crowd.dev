import { beforeEach, describe, expect, it, vi } from 'vitest'

import { startRun } from './dispatcherActivities'

const PROBE_AT = new Date('2026-10-16T12:05:00.000Z')

const mocks = vi.hoisted(() => ({
  start: vi.fn(),
  describe: vi.fn(),
  renewRunningUnitLease: vi.fn(),
  rescheduleUnit: vi.fn(),
}))

vi.mock('../main', () => ({
  svc: {
    postgres: { writer: {} },
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    temporal: {
      workflow: { start: mocks.start, getHandle: () => ({ describe: mocks.describe }) },
    },
  },
}))

vi.mock('@crowd/data-access-layer/src/connectors', () => ({
  claimDueUnits: vi.fn(),
  renewRunningUnitLease: mocks.renewRunningUnitLease,
  rescheduleUnit: mocks.rescheduleUnit,
}))

vi.mock('@crowd/data-access-layer/src/queryExecutor', () => ({
  dbStoreQx: vi.fn(() => ({})),
}))

vi.mock('../scheduling', () => ({
  runningProbeRunAt: () => PROBE_AT,
  shortDeferRunAt: () => PROBE_AT,
}))

const UNIT = {
  id: 'unit-1',
  integrationId: 'integration-1',
  platform: 'github',
  syncName: 'issues',
  channelId: 'repo',
  channelName: 'https://github.com/org/repo',
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.describe.mockResolvedValue({ startTime: new Date('2026-10-16T11:00:00.000Z') })
  mocks.renewRunningUnitLease.mockResolvedValue(1)
})

describe('startRun', () => {
  it('starts a workflow without touching the claim', async () => {
    mocks.start.mockResolvedValue(undefined)

    expect(await startRun(UNIT)).toBe('started')
    expect(mocks.renewRunningUnitLease).not.toHaveBeenCalled()
    expect(mocks.rescheduleUnit).not.toHaveBeenCalled()
  })

  it('keeps a still-running unit claimed instead of releasing it', async () => {
    const alreadyStarted = new Error('already started')
    alreadyStarted.name = 'WorkflowExecutionAlreadyStartedError'
    mocks.start.mockRejectedValue(alreadyStarted)

    expect(await startRun(UNIT)).toBe('alreadyRunning')
    expect(mocks.renewRunningUnitLease).toHaveBeenCalledWith({}, UNIT.id, PROBE_AT)
    expect(mocks.rescheduleUnit).not.toHaveBeenCalled()
  })
})
