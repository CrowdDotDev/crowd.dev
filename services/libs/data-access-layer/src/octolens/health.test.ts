import { test as base, describe, expect } from 'vitest'

import { DEFAULT_TENANT_ID, generateUUIDv1 } from '@crowd/common'
import type { QueryExecutor } from '@crowd/database'
import { withQx } from '@crowd/test-kit/db'

import {
  getOctolensMappingDiscoveryHealth,
  listOctolensKeywordMappingsDeactivatedBetween,
} from './health'
import {
  findOrCreateOctolensAnchorIntegration,
  reconcileOctolensKeywordMappings,
  upsertOctolensKeywordMapping,
} from './index'

const test = withQx(base)

async function createSegment(qx: QueryExecutor, name: string): Promise<string> {
  const id = generateUUIDv1()
  await qx.result(
    `
    INSERT INTO public.segments (id, slug, name, "tenantId", "createdAt", "updatedAt")
    VALUES ($(id), $(slug), $(name), $(tenantId), NOW(), NOW())
    `,
    { id, slug: `${name}-slug`, name, tenantId: DEFAULT_TENANT_ID },
  )
  return id
}

async function createIntegration(
  qx: QueryExecutor,
  options: { segmentId: string | null; platform?: string; deleted?: boolean },
): Promise<string> {
  const id = generateUUIDv1()
  await qx.result(
    `
    INSERT INTO public.integrations
      (id, platform, status, "segmentId", "tenantId", "createdAt", "updatedAt", "deletedAt")
    VALUES ($(id), $(platform), 'done', $(segmentId), $(tenantId), NOW(), NOW(),
            CASE WHEN $(deleted) THEN NOW() END)
    `,
    {
      id,
      platform: options.platform ?? 'octolens',
      segmentId: options.segmentId,
      tenantId: DEFAULT_TENANT_ID,
      deleted: options.deleted ?? false,
    },
  )
  return id
}

async function createActiveSyncUnit(qx: QueryExecutor, integrationId: string): Promise<void> {
  await qx.result(
    `
    INSERT INTO integration.sync_units
      ("integrationId", platform, "channelId", "channelName", "syncName", status)
    VALUES ($(integrationId), 'octolens', 'octolens', 'octolens', 'mentionPoll', 'active')
    `,
    { integrationId },
  )
}

async function setTimestamps(
  qx: QueryExecutor,
  keywordId: number,
  timestamps: { lastSeenAt: string; deactivatedAt?: string },
): Promise<void> {
  await qx.result(
    `
    UPDATE integration."octolensKeywordMappings"
    SET "lastSeenAt" = $(lastSeenAt), "deactivatedAt" = $(deactivatedAt)
    WHERE "keywordId" = $(keywordId)
    `,
    {
      keywordId,
      lastSeenAt: timestamps.lastSeenAt,
      deactivatedAt: timestamps.deactivatedAt ?? null,
    },
  )
}

async function readDeactivatedAt(qx: QueryExecutor, keywordId: number): Promise<Date> {
  const row: { deactivatedAt: string } = await qx.selectOne(
    `SELECT "deactivatedAt" FROM integration."octolensKeywordMappings" WHERE "keywordId" = $(keywordId)`,
    { keywordId },
  )
  return new Date(row.deactivatedAt)
}

describe('getOctolensMappingDiscoveryHealth', () => {
  test('reports nothing to judge without mappings, even with the anchor in place', async ({
    qx,
  }) => {
    const anchor = await findOrCreateOctolensAnchorIntegration(qx)
    await createActiveSyncUnit(qx, anchor.id)

    const health = await getOctolensMappingDiscoveryHealth(qx)

    expect(health).toMatchObject({ activeMappings: 0, integrations: 0, lastDiscoveredAt: null })
    expect(health.checkedAt).toBeInstanceOf(Date)
  })

  test('takes the newest lastSeenAt across active mappings of every live subproject integration', async ({
    qx,
  }) => {
    const segmentA = await createSegment(qx, 'a')
    const segmentB = await createSegment(qx, 'b')
    await reconcileOctolensKeywordMappings(qx, [
      { keywordId: 1, keyword: 'k1', segmentId: segmentA },
      { keywordId: 2, keyword: 'k2', segmentId: segmentA },
      { keywordId: 3, keyword: 'k3', segmentId: segmentB },
    ])
    await setTimestamps(qx, 1, { lastSeenAt: '2026-01-01T09:00:00Z' })
    await setTimestamps(qx, 2, {
      lastSeenAt: '2026-01-01T12:00:00Z',
      deactivatedAt: '2026-01-01T12:00:00Z',
    })
    await setTimestamps(qx, 3, { lastSeenAt: '2026-01-01T10:00:00Z' })

    const health = await getOctolensMappingDiscoveryHealth(qx)

    expect(health).toMatchObject({ activeMappings: 2, integrations: 2 })
    expect(health.lastDiscoveredAt?.toISOString()).toBe('2026-01-01T10:00:00.000Z')
  })

  test('ignores soft-deleted, sync-unit-owning and non-octolens integrations', async ({ qx }) => {
    const segmentId = await createSegment(qx, 's')
    const live = await createIntegration(qx, { segmentId })
    const deleted = await createIntegration(qx, { segmentId, deleted: true })
    const legacyOwner = await createIntegration(qx, { segmentId })
    await createActiveSyncUnit(qx, legacyOwner)
    const github = await createIntegration(qx, { segmentId, platform: 'github' })
    const integrationByKeywordId = { 1: live, 2: deleted, 3: legacyOwner, 4: github }
    for (const [keywordId, integrationId] of Object.entries(integrationByKeywordId)) {
      await upsertOctolensKeywordMapping(qx, {
        integrationId,
        segmentId,
        keywordId: Number(keywordId),
        keyword: `k${keywordId}`,
      })
    }
    await setTimestamps(qx, 1, { lastSeenAt: '2026-01-01T09:00:00Z' })

    const health = await getOctolensMappingDiscoveryHealth(qx)

    expect(health).toMatchObject({ activeMappings: 1, integrations: 1 })
    expect(health.lastDiscoveredAt?.toISOString()).toBe('2026-01-01T09:00:00.000Z')
  })
})

describe('listOctolensKeywordMappingsDeactivatedBetween', () => {
  test('excludes since, includes until, and joins the project', async ({ qx }) => {
    const segmentId = await createSegment(qx, 'project')
    await reconcileOctolensKeywordMappings(
      qx,
      [1, 2, 3, 4, 5].map((keywordId) => ({ keywordId, keyword: `k${keywordId}`, segmentId })),
    )
    await setTimestamps(qx, 1, {
      lastSeenAt: '2026-01-01T09:00:00Z',
      deactivatedAt: '2026-01-01T10:00:00Z',
    })
    await setTimestamps(qx, 2, {
      lastSeenAt: '2026-01-01T09:00:00Z',
      deactivatedAt: '2026-01-01T10:30:00.000123Z',
    })
    await setTimestamps(qx, 3, {
      lastSeenAt: '2026-01-01T09:00:00Z',
      deactivatedAt: '2026-01-01T11:00:00Z',
    })
    await setTimestamps(qx, 4, {
      lastSeenAt: '2026-01-01T09:00:00Z',
      deactivatedAt: '2026-01-01T11:00:00.000001Z',
    })

    const rows = await listOctolensKeywordMappingsDeactivatedBetween(
      qx,
      new Date('2026-01-01T10:00:00Z'),
      new Date('2026-01-01T11:00:00Z'),
    )

    expect(rows.map((r) => r.keyword)).toEqual(['k2', 'k3'])
    expect(rows[0]).toMatchObject({
      keywordId: 2,
      segmentId,
      segmentName: 'project',
      segmentSlug: 'project-slug',
      integrationDeleted: false,
    })
    expect(rows[0].deactivatedAt.toISOString()).toBe('2026-01-01T10:30:00.000Z')
  })

  test('keeps mappings whose subproject integration discovery soft-deleted in the same run', async ({
    qx,
  }) => {
    const kept = await createSegment(qx, 'kept')
    const emptied = await createSegment(qx, 'emptied')
    await reconcileOctolensKeywordMappings(qx, [
      { keywordId: 1, keyword: 'k1', segmentId: kept },
      { keywordId: 2, keyword: 'k2', segmentId: emptied },
      { keywordId: 3, keyword: 'k3', segmentId: emptied },
    ])
    const outcome = await reconcileOctolensKeywordMappings(qx, [
      { keywordId: 1, keyword: 'k1', segmentId: kept },
    ])
    expect(outcome.softDeleted).toHaveLength(1)
    const deactivatedAt = await readDeactivatedAt(qx, 2)

    const rows = await listOctolensKeywordMappingsDeactivatedBetween(
      qx,
      new Date(deactivatedAt.getTime() - 1000),
      new Date(deactivatedAt.getTime() + 1000),
    )

    expect(rows.map((r) => [r.keyword, r.segmentName, r.integrationDeleted])).toEqual([
      ['k2', 'emptied', true],
      ['k3', 'emptied', true],
    ])
    expect(rows[0].deactivatedAt.getTime()).toBe(rows[1].deactivatedAt.getTime())
  })
})
