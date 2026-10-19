import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { IntegrationResultType } from '@crowd/types'

import {
  evaluateForwardGate,
  pauseNangoRepoSync,
  replayShadowRecords,
  resolveSwitchTarget,
  setUnitEmitEnabled,
} from './switchSyncPipelineActivities'

const mocks = vi.hoisted(() => ({
  findSyncUnitByChannelName: vi.fn(),
  getSyncDiffCountsForDays: vi.fn(),
  setSyncUnitEmitEnabled: vi.fn(),
  listShadowRecordsBatch: vi.fn(),
  deleteShadowRecords: vi.fn(),
  publishExternalResult: vi.fn(),
  triggerResultProcessing: vi.fn(),
  heartbeat: vi.fn(),
  findActiveNangoMappingForRepo: vi.fn(),
  getNangoModelLastCheckedAt: vi.fn(),
  initNangoCloudClient: vi.fn(),
  pauseNangoSync: vi.fn(),
  startNangoSync: vi.fn(),
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('../main', () => ({
  svc: {
    postgres: { writer: {} },
    log: mocks.log,
    dataSinkWorkerEmitter: { triggerResultProcessing: mocks.triggerResultProcessing },
  },
}))
vi.mock('@temporalio/activity', () => ({
  Context: { current: () => ({ heartbeat: mocks.heartbeat }) },
}))
vi.mock(
  '@crowd/data-access-layer/src/old/apps/integration_stream_worker/integrationStream.repo',
  () => ({
    default: class {
      publishExternalResult = mocks.publishExternalResult
    },
  }),
)
vi.mock('@crowd/data-access-layer/src/queryExecutor', () => ({ dbStoreQx: vi.fn(() => 'qx') }))
vi.mock('@crowd/data-access-layer/src/connectors', () => ({
  findSyncUnitByChannelName: mocks.findSyncUnitByChannelName,
  getSyncDiffCountsForDays: mocks.getSyncDiffCountsForDays,
  setSyncUnitEmitEnabled: mocks.setSyncUnitEmitEnabled,
  listShadowRecordsBatch: mocks.listShadowRecordsBatch,
  deleteShadowRecords: mocks.deleteShadowRecords,
}))
vi.mock('@crowd/data-access-layer/src/integrations', () => ({
  findActiveNangoMappingForRepo: mocks.findActiveNangoMappingForRepo,
  getNangoModelLastCheckedAt: mocks.getNangoModelLastCheckedAt,
}))
vi.mock('@crowd/nango', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@crowd/nango')>()),
  initNangoCloudClient: mocks.initNangoCloudClient,
  pauseNangoSync: mocks.pauseNangoSync,
  startNangoSync: mocks.startNangoSync,
}))

const activeUnit = {
  id: 'u-1',
  status: 'active',
  emitEnabled: false,
  watermark: { phase: 'incremental' },
}

describe('switch activities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ now: new Date('2026-10-19T10:00:00Z') })
  })
  afterEach(() => vi.useRealTimers())

  it('resolves the repo through its nango mapping and builds the channel name from it', async () => {
    mocks.findActiveNangoMappingForRepo.mockResolvedValue({
      integrationId: 'int-1',
      connectionId: 'conn-1',
      owner: 'Kubernetes',
      repoName: 'kubernetes',
    })

    await expect(
      resolveSwitchTarget({ owner: 'kubernetes', repo: 'KUBERNETES', syncNames: ['issues'] }),
    ).resolves.toEqual({
      target: {
        integrationId: 'int-1',
        connectionId: 'conn-1',
        channelName: 'https://github.com/Kubernetes/kubernetes',
      },
      syncs: [{ syncName: 'issues', nangoSync: 'issues' }],
    })
  })

  it('gates on the unit, nango consumption, then the three most recent diffed days', async () => {
    mocks.findSyncUnitByChannelName.mockResolvedValue(activeUnit)
    mocks.getNangoModelLastCheckedAt.mockResolvedValue('2026-10-19T09:30:00Z')
    mocks.getNangoModelLastCheckedAt.mockResolvedValue('2026-10-19T09:30:00Z')
    mocks.getSyncDiffCountsForDays.mockResolvedValue(
      ['2026-10-17', '2026-10-16', '2026-10-15'].map((day) => ({
        day,
        missingInShadowCount: 0,
        unsupportedSyncCount: 0,
      })),
    )

    await expect(
      evaluateForwardGate({
        integrationId: 'int-1',
        connectionId: 'conn-1',
        channelName: 'https://github.com/o/r',
        syncName: 'issues',
      }),
    ).resolves.toEqual({ ok: true, unitId: 'u-1' })
    expect(mocks.findSyncUnitByChannelName).toHaveBeenCalledWith(
      'qx',
      'int-1',
      'github',
      'https://github.com/o/r',
      'issues',
    )
    expect(mocks.getSyncDiffCountsForDays).toHaveBeenCalledWith('qx', 'u-1', [
      '2026-10-17',
      '2026-10-16',
      '2026-10-15',
    ])

    mocks.findSyncUnitByChannelName.mockResolvedValue({ ...activeUnit, status: 'dead_letter' })
    await expect(
      evaluateForwardGate({
        integrationId: 'int-1',
        connectionId: 'conn-1',
        channelName: 'https://github.com/o/r',
        syncName: 'issues',
      }),
    ).resolves.toMatchObject({ ok: false, outcome: 'refused' })
    expect(mocks.getSyncDiffCountsForDays).toHaveBeenCalledTimes(1)
  })

  it('pauses the one nango sync on an initialised client and logs a no-op flag flip', async () => {
    await pauseNangoRepoSync({ connectionId: 'conn-1', nangoSync: 'pull-request-reviews' })
    expect(mocks.initNangoCloudClient).toHaveBeenCalled()
    expect(mocks.pauseNangoSync).toHaveBeenCalledWith('github', 'conn-1', ['pull-request-reviews'])

    mocks.setSyncUnitEmitEnabled.mockResolvedValue(0)
    await setUnitEmitEnabled({ unitId: 'u-1', emitEnabled: true })
    expect(mocks.setSyncUnitEmitEnabled).toHaveBeenCalledWith('qx', 'u-1', true)
    expect(mocks.log.info).toHaveBeenCalledWith(
      expect.objectContaining({ alreadyInState: true, unitId: 'u-1' }),
      'sync unit emit flag set',
    )
  })

  it('replays every remaining shadow record through the sink path, batch by batch, then deletes it', async () => {
    const row = (sourceId: string) => ({
      type: 'issues-opened',
      sourceId,
      occurredAt: '2026-10-18T00:00:00Z',
      data: { sourceId },
      segmentId: 'seg-1',
      integrationId: 'int-1',
    })
    mocks.listShadowRecordsBatch
      .mockResolvedValueOnce([row('a'), row('b')])
      .mockResolvedValueOnce([row('c')])
      .mockResolvedValueOnce([])
    mocks.publishExternalResult.mockImplementation(
      async (_: string, r: { data: { sourceId: string } }) => `res-${r.data.sourceId}`,
    )

    await expect(replayShadowRecords({ unitId: 'u-1' })).resolves.toBe(3)

    expect(mocks.publishExternalResult).toHaveBeenCalledTimes(3)
    expect(mocks.publishExternalResult).toHaveBeenCalledWith('int-1', {
      type: IntegrationResultType.ACTIVITY,
      segmentId: 'seg-1',
      data: { sourceId: 'c' },
    })
    expect(mocks.triggerResultProcessing).toHaveBeenCalledWith('res-c', 'res-c', false)
    expect(mocks.deleteShadowRecords.mock.calls.map(([, , batch]) => batch.length)).toEqual([2, 1])
    expect(mocks.heartbeat).toHaveBeenLastCalledWith(3)
  })
})
