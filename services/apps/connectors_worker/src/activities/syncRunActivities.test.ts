import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { SyncContext, SyncOutcome } from '@crowd/connectors'

import { executeSync } from './syncRunActivities'

const CADENCE_RUN_AT = new Date('2026-10-16T12:05:00.000Z')
const SHORT_DEFER_RUN_AT = new Date('2026-10-16T12:01:00.000Z')

const mocks = vi.hoisted(() => ({
  run: vi.fn(),
  getUnitById: vi.fn(),
  reassertUnitClaim: vi.fn(),
  recordRunSuccess: vi.fn(),
}))

vi.mock('@temporalio/activity', () => ({
  Context: {
    current: () => ({
      info: { workflowExecution: { workflowId: 'wf', runId: 'run' } },
      heartbeat: vi.fn(),
    }),
  },
}))

vi.mock('../main', () => ({
  svc: {
    postgres: { writer: {} },
    redis: {},
    dataSinkWorkerEmitter: {},
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  },
}))

vi.mock('@crowd/logging', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@crowd/logging')>()),
  getChildLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

vi.mock('@crowd/connectors', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@crowd/connectors')>()),
  getManifest: () => ({}),
  getSync: () => ({ cadenceMinutes: 5, schema: {}, run: mocks.run }),
  findSync: () => ({ cadenceMinutes: 5 }),
  createTokenPool: () => ({ acquire: vi.fn(), park: vi.fn(), invalidate: vi.fn() }),
  createHttpClient: () => ({ requestCount: () => 0 }),
  createEmit: () => ({ emit: vi.fn(), emittedCount: () => 3 }),
}))

vi.mock('@crowd/data-access-layer/src/connectors', () => ({
  getUnitById: mocks.getUnitById,
  reassertUnitClaim: mocks.reassertUnitClaim,
  recordRunSuccess: mocks.recordRunSuccess,
  recordRunPartial: vi.fn(),
  recordRunFailure: vi.fn(),
  parkUnit: vi.fn(),
  recordShadowRecords: vi.fn(),
}))

vi.mock('@crowd/data-access-layer/src/integrations', () => ({
  fetchIntegrationById: async () => ({ segmentId: 'segment-1' }),
}))

vi.mock(
  '@crowd/data-access-layer/src/old/apps/integration_stream_worker/integrationStream.repo',
  () => ({
    default: class {
      publishExternalResult = vi.fn()
    },
  }),
)

vi.mock('@crowd/data-access-layer/src/queryExecutor', () => ({
  dbStoreQx: vi.fn(() => ({})),
}))

vi.mock('../scheduling', () => ({
  cadenceRunAt: () => CADENCE_RUN_AT,
  shortDeferRunAt: () => SHORT_DEFER_RUN_AT,
  failureRunAt: () => SHORT_DEFER_RUN_AT,
}))

const UNIT = {
  id: 'unit-1',
  integrationId: 'integration-1',
  platform: 'octolens',
  syncName: 'mentionPoll',
  channelId: 'channel',
  channelName: 'channel',
  watermark: { cursor: 'before' },
  emitEnabled: true,
  consecutiveFailures: 0,
}

function runReturning(outcome: SyncOutcome) {
  mocks.run.mockImplementation(async (ctx: SyncContext<unknown>) => {
    await ctx.commitWatermark({ cursor: 'after' })
    return outcome
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getUnitById.mockResolvedValue(UNIT)
})

describe('executeSync outcome scheduling', () => {
  it.each([
    [{ complete: true }, true, CADENCE_RUN_AT],
    [{ complete: false }, false, SHORT_DEFER_RUN_AT],
    [{ complete: false, resumeAtCadence: true }, false, CADENCE_RUN_AT],
  ])('records %j as complete=%s, next run at %s', async (outcome, complete, nextRunAt) => {
    runReturning(outcome)

    await executeSync(UNIT.id)

    expect(mocks.recordRunSuccess).toHaveBeenCalledWith(
      {},
      UNIT.id,
      { watermark: { cursor: 'after' }, emittedCount: 3, complete },
      nextRunAt,
    )
  })
})

describe('executeSync claim', () => {
  it('re-locks the unit before reading it, so the whole run is covered by lockedAt', async () => {
    runReturning({ complete: true })

    await executeSync(UNIT.id)

    expect(mocks.reassertUnitClaim).toHaveBeenCalledWith({}, UNIT.id)
    expect(mocks.reassertUnitClaim.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.getUnitById.mock.invocationCallOrder[0],
    )
  })
})
