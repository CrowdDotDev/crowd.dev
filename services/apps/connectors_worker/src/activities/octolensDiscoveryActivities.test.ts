import { beforeEach, describe, expect, it, vi } from 'vitest'

import { runOctolensDiscovery } from './octolensDiscoveryActivities'

const calls: string[] = []
const record =
  <T>(name: string, value: T) =>
  async (...args: unknown[]) => {
    calls.push(`${name}${args.length > 1 ? ` ${JSON.stringify(args.slice(1))}` : ''}`)
    return value
  }

const mocks = vi.hoisted(() => ({
  findOrCreateOctolensAnchorIntegration: vi.fn(),
  findOrCreateOctolensSubprojectIntegration: vi.fn(),
  upsertOctolensKeywordMapping: vi.fn(),
  deactivateOctolensKeywordMappingsNotSeenAcross: vi.fn(),
  softDeleteOctolensSubprojectIntegrationsWithoutActiveMappings: vi.fn(),
  upsertSyncUnits: vi.fn(),
  getCredential: vi.fn(),
  discover: vi.fn(),
  runMappingDiscovery: vi.fn(),
}))

vi.mock('../main', () => ({
  svc: {
    postgres: { writer: {} },
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  },
}))

vi.mock('@crowd/data-access-layer/src/queryExecutor', () => ({
  dbStoreQx: vi.fn(() => ({})),
}))

vi.mock('@crowd/data-access-layer/src/octolens', () => ({
  findOrCreateOctolensAnchorIntegration: mocks.findOrCreateOctolensAnchorIntegration,
  findOrCreateOctolensSubprojectIntegration: mocks.findOrCreateOctolensSubprojectIntegration,
  upsertOctolensKeywordMapping: mocks.upsertOctolensKeywordMapping,
  deactivateOctolensKeywordMappingsNotSeenAcross:
    mocks.deactivateOctolensKeywordMappingsNotSeenAcross,
  softDeleteOctolensSubprojectIntegrationsWithoutActiveMappings:
    mocks.softDeleteOctolensSubprojectIntegrationsWithoutActiveMappings,
}))

vi.mock('@crowd/data-access-layer/src/connectors', () => ({
  upsertSyncUnits: mocks.upsertSyncUnits,
}))

vi.mock('@crowd/connectors', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@crowd/connectors')>()),
  getCredential: mocks.getCredential,
  getManifest: () => ({ discover: mocks.discover }),
}))

vi.mock('@crowd/connectors/src/connectors/octolens/deps', () => ({
  resolveOctolensProjectSegmentId: vi.fn(),
}))

vi.mock('@crowd/connectors/src/connectors/octolens/mappingDiscovery', () => ({
  runMappingDiscovery: mocks.runMappingDiscovery,
}))

const MAPPINGS = [
  { keywordId: 1, keyword: 'ebpf', segmentId: 'segment-ebpf' },
  { keywordId: 2, keyword: 'cilium', segmentId: 'segment-ebpf' },
  { keywordId: 3, keyword: 'valkey', segmentId: 'segment-valkey' },
]

beforeEach(() => {
  vi.clearAllMocks()
  calls.length = 0
  mocks.findOrCreateOctolensAnchorIntegration.mockImplementation(
    record('anchor', { id: 'anchor', created: true, restored: false }),
  )
  mocks.getCredential.mockResolvedValue({
    platform: 'octolens',
    kind: 'octolens-token',
    data: { token: 'token' },
  })
  mocks.discover.mockResolvedValue([
    { channelId: 'octolens-global', channelName: 'octolens-global' },
  ])
  mocks.upsertSyncUnits.mockImplementation(record('upsertSyncUnits', 1))
  mocks.findOrCreateOctolensSubprojectIntegration.mockImplementation(
    async (_qx: unknown, segmentId: string) => {
      calls.push(`findOrCreateSubproject ${segmentId}`)
      return { id: `integration-${segmentId}`, created: false, restored: false }
    },
  )
  mocks.upsertOctolensKeywordMapping.mockImplementation(
    async (_qx: unknown, mapping: { keywordId: number }) => {
      calls.push(`upsertMapping ${mapping.keywordId}`)
    },
  )
  mocks.deactivateOctolensKeywordMappingsNotSeenAcross.mockImplementation(record('deactivate', 4))
  mocks.softDeleteOctolensSubprojectIntegrationsWithoutActiveMappings.mockImplementation(
    record('softDelete', []),
  )
  mocks.runMappingDiscovery.mockImplementation(
    async ({
      reconcileMappings,
    }: {
      reconcileMappings: (m: typeof MAPPINGS) => Promise<number>
    }) => {
      const deactivated = await reconcileMappings(MAPPINGS)
      return { complete: true, mappings: MAPPINGS.length, deactivated }
    },
  )
})

describe('runOctolensDiscovery', () => {
  it('ensures the anchor and its mention poll unit with emitEnabled, so mentions become activities', async () => {
    await runOctolensDiscovery()

    expect(mocks.getCredential).toHaveBeenCalledWith(expect.anything(), 'anchor')
    expect(mocks.upsertSyncUnits).toHaveBeenCalledWith(expect.anything(), [
      {
        integrationId: 'anchor',
        platform: 'octolens',
        channelId: 'octolens-global',
        channelName: 'octolens-global',
        syncName: 'mentionPoll',
        emitEnabled: true,
      },
    ])
  })

  it('writes each mapping under its subproject integration, one integration per segment', async () => {
    const result = await runOctolensDiscovery()

    expect(mocks.findOrCreateOctolensSubprojectIntegration).toHaveBeenCalledTimes(2)
    expect(mocks.upsertOctolensKeywordMapping).toHaveBeenCalledWith(expect.anything(), {
      integrationId: 'integration-segment-ebpf',
      keywordId: 2,
      keyword: 'cilium',
      segmentId: 'segment-ebpf',
    })
    expect(mocks.deactivateOctolensKeywordMappingsNotSeenAcross).toHaveBeenCalledWith(
      expect.anything(),
      [
        { integrationId: 'integration-segment-ebpf', keywordId: 1 },
        { integrationId: 'integration-segment-ebpf', keywordId: 2 },
        { integrationId: 'integration-segment-valkey', keywordId: 3 },
      ],
    )
    expect(result).toEqual({ complete: true, mappings: 3, deactivated: 4 })
  })

  it('soft-deletes emptied integrations only after every upsert and the deactivation', async () => {
    await runOctolensDiscovery()

    expect(calls).toEqual([
      'anchor',
      'upsertSyncUnits [[{"integrationId":"anchor","platform":"octolens","channelId":"octolens-global","channelName":"octolens-global","syncName":"mentionPoll","emitEnabled":true}]]',
      'findOrCreateSubproject segment-ebpf',
      'upsertMapping 1',
      'upsertMapping 2',
      'findOrCreateSubproject segment-valkey',
      'upsertMapping 3',
      expect.stringMatching(/^deactivate /),
      'softDelete',
    ])
  })

  it('writes nothing when discovery does not reconcile (incomplete snapshot)', async () => {
    mocks.runMappingDiscovery.mockResolvedValue({ complete: false, mappings: 0, deactivated: 0 })

    await runOctolensDiscovery()

    expect(mocks.findOrCreateOctolensSubprojectIntegration).not.toHaveBeenCalled()
    expect(mocks.deactivateOctolensKeywordMappingsNotSeenAcross).not.toHaveBeenCalled()
    expect(
      mocks.softDeleteOctolensSubprojectIntegrationsWithoutActiveMappings,
    ).not.toHaveBeenCalled()
  })
})
