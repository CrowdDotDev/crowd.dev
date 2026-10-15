import {
  assertCredentialKind,
  getCredential,
  getManifest,
  isOctolensCredentialConfigured,
} from '@crowd/connectors'
import { resolveOctolensProjectSegmentId } from '@crowd/connectors/src/connectors/octolens/deps'
import { runMappingDiscovery } from '@crowd/connectors/src/connectors/octolens/mappingDiscovery'
import type {
  OctolensKeywordMappingInput,
  OctolensMappingDiscoveryResult,
} from '@crowd/connectors/src/connectors/octolens/mappingDiscovery'
import {
  reviveDeadLetteredSyncUnits,
  upsertSyncUnits,
} from '@crowd/data-access-layer/src/connectors'
import {
  deactivateOctolensKeywordMappingsNotSeenAcross,
  findOrCreateOctolensAnchorIntegration,
  findOrCreateOctolensSubprojectIntegration,
  softDeleteOctolensSubprojectIntegrationsWithoutActiveMappings,
  upsertOctolensKeywordMapping,
} from '@crowd/data-access-layer/src/octolens'
import type { QueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'
import { dbStoreQx } from '@crowd/data-access-layer/src/queryExecutor'
import { PlatformType } from '@crowd/types'

import { svc } from '../main'

const MENTION_POLL_SYNC_NAME = 'mentionPoll'

// One transaction, so a poll never sees a moving keyword active under two subprojects, and the
// soft-delete (last) never drops an integration this run just mapped.
async function reconcileOctolensMappings(
  qx: QueryExecutor,
  mappings: OctolensKeywordMappingInput[],
): Promise<number> {
  return qx.tx((tx) => reconcileInTransaction(tx, mappings))
}

async function reconcileInTransaction(
  qx: QueryExecutor,
  mappings: OctolensKeywordMappingInput[],
): Promise<number> {
  const integrationBySegment = new Map<string, string>()
  const seen: { integrationId: string; keywordId: number }[] = []
  for (const mapping of mappings) {
    let integrationId = integrationBySegment.get(mapping.segmentId)
    if (!integrationId) {
      const integration = await findOrCreateOctolensSubprojectIntegration(qx, mapping.segmentId)
      if (integration.created || integration.restored) {
        svc.log.info(
          {
            integrationId: integration.id,
            segmentId: mapping.segmentId,
            created: integration.created,
            restored: integration.restored,
          },
          'octolens discovery: subproject integration created or restored',
        )
      }
      integrationId = integration.id
      integrationBySegment.set(mapping.segmentId, integrationId)
    }
    await upsertOctolensKeywordMapping(qx, { integrationId, ...mapping })
    seen.push({ integrationId, keywordId: mapping.keywordId })
  }

  const deactivated = await deactivateOctolensKeywordMappingsNotSeenAcross(qx, seen)

  const softDeleted = await softDeleteOctolensSubprojectIntegrationsWithoutActiveMappings(qx)
  if (softDeleted.length > 0) {
    svc.log.info(
      { integrationIds: softDeleted },
      'octolens discovery: soft-deleted subproject integrations with no active keywords',
    )
  }

  return deactivated
}

export async function runOctolensDiscovery(): Promise<OctolensMappingDiscoveryResult> {
  if (!isOctolensCredentialConfigured()) {
    svc.log.warn('octolens discovery skipped: CROWD_OCTOLENS_API_TOKEN is not set')
    return { complete: false, mappings: 0, deactivated: 0 }
  }

  const qx = dbStoreQx(svc.postgres.writer)

  // The anchor owns the single mention poll: Octolens's 500 req/hr budget is shared org-wide.
  const anchor = await findOrCreateOctolensAnchorIntegration(qx)
  const credential = await getCredential(qx, anchor.id)
  assertCredentialKind(credential, 'octolens-token')

  const channels = await getManifest(PlatformType.OCTOLENS).discover(credential)
  // emitEnabled is insert-only and must be true: false is shadow mode, which writes no activities.
  const created = await upsertSyncUnits(
    qx,
    channels.map((channel) => ({
      integrationId: anchor.id,
      platform: PlatformType.OCTOLENS,
      channelId: channel.channelId,
      channelName: channel.channelName,
      syncName: MENTION_POLL_SYNC_NAME,
      emitEnabled: true,
    })),
  )
  svc.log.info(
    { anchorIntegrationId: anchor.id, anchorCreated: anchor.created, syncUnits: created },
    'octolens discovery: ensured the mention poll sync unit (emitEnabled on insert)',
  )

  const result = await runMappingDiscovery({
    token: credential.data.token,
    log: svc.log,
    resolveProjectSegmentId: (slug) => resolveOctolensProjectSegmentId(qx, slug),
    reconcileMappings: (mappings) => reconcileOctolensMappings(qx, mappings),
  })

  // Discovery's own Octolens calls just succeeded with this token, so an auth dead-letter is stale.
  const revived = await reviveDeadLetteredSyncUnits(qx, anchor.id, MENTION_POLL_SYNC_NAME)
  if (revived > 0) {
    svc.log.info(
      { anchorIntegrationId: anchor.id },
      'octolens discovery: revived the dead-lettered mention poll sync unit',
    )
  }

  return result
}
