import { beforeEach, describe, expect, it, vi } from 'vitest'

import { runOctolensDiscovery } from './octolensDiscoveryActivities'

const calls: string[] = []
const qx = {
  tx: async (fn: (tx: unknown) => Promise<unknown>) => {
    calls.push('tx')
    return fn(qx)
  },
}
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
  reviveDeadLetteredSyncUnits: vi.fn(),
  getCredential: vi.fn(),
  discover: vi.fn(),
  runMappingDiscovery: vi.fn(),
  isOctolensCredentialConfigured: vi.fn(),
}))

vi.mock('../main', () => ({
  svc: {
    postgres: { writer: {} },
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  },
}))

vi.mock('@crowd/data-access-layer/src/queryExecutor', () => ({
  dbStoreQx: vi.fn(() => qx),
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
  reviveDeadLetteredSyncUnits: mocks.reviveDeadLetteredSyncUnits,
}))

vi.mock('@crowd/connectors', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@crowd/connectors')>()),
  getCredential: mocks.getCredential,
  getManifest: () => ({ discover: mocks.discover }),
  isOctolensCredentialConfigured: mocks.isOctolensCredentialConfigured,
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
  mocks.isOctolensCredentialConfigured.mockReturnValue(true)
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
  mocks.reviveDeadLetteredSyncUnits.mockImplementation(record('revive', 0))
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

  it('reconciles in one transaction, soft-deleting emptied integrations last', async () => {
    await runOctolensDiscovery()

    expect(calls).toEqual([
      'anchor',
      'upsertSyncUnits [[{"integrationId":"anchor","platform":"octolens","channelId":"octolens-global","channelName":"octolens-global","syncName":"mentionPoll","emitEnabled":true}]]',
      'tx',
      'findOrCreateSubproject segment-ebpf',
      'upsertMapping 1',
      'upsertMapping 2',
      'findOrCreateSubproject segment-valkey',
      'upsertMapping 3',
      expect.stringMatching(/^deactivate /),
      'softDelete',
      'revive ["anchor","mentionPoll"]',
    ])
  })

  it('does nothing at all when no Octolens token is configured', async () => {
    mocks.isOctolensCredentialConfigured.mockReturnValue(false)

    const result = await runOctolensDiscovery()

    expect(result).toEqual({ complete: false, mappings: 0, deactivated: 0 })
    expect(mocks.findOrCreateOctolensAnchorIntegration).not.toHaveBeenCalled()
    expect(mocks.upsertSyncUnits).not.toHaveBeenCalled()
    expect(mocks.runMappingDiscovery).not.toHaveBeenCalled()
  })

  it('revives the dead-lettered mention poll only after Octolens answered with this token', async () => {
    await runOctolensDiscovery()
    expect(mocks.reviveDeadLetteredSyncUnits).toHaveBeenCalledWith(
      expect.anything(),
      'anchor',
      'mentionPoll',
    )

    mocks.reviveDeadLetteredSyncUnits.mockClear()
    mocks.runMappingDiscovery.mockRejectedValue(new Error('provider authentication failed'))
    await expect(runOctolensDiscovery()).rejects.toThrow('provider authentication failed')
    expect(mocks.reviveDeadLetteredSyncUnits).not.toHaveBeenCalled()
  })

  it('makes no mapping writes when discovery does not reconcile (incomplete snapshot)', async () => {
    mocks.runMappingDiscovery.mockResolvedValue({ complete: false, mappings: 0, deactivated: 0 })

    await runOctolensDiscovery()

    expect(mocks.findOrCreateOctolensSubprojectIntegration).not.toHaveBeenCalled()
    expect(mocks.deactivateOctolensKeywordMappingsNotSeenAcross).not.toHaveBeenCalled()
    expect(
      mocks.softDeleteOctolensSubprojectIntegrationsWithoutActiveMappings,
    ).not.toHaveBeenCalled()
  })
})
