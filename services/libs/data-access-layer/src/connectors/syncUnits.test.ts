import { test as base, describe, expect } from 'vitest'

import { DEFAULT_TENANT_ID, generateUUIDv1 } from '@crowd/common'
import type { QueryExecutor } from '@crowd/database'
import { withQx } from '@crowd/test-kit/db'

import { listShadowDiffUnits, upsertSyncUnits } from './syncUnits'

const test = withQx(base)

async function createIntegration(
  qx: QueryExecutor,
  overrides: { deletedAt?: string } = {},
): Promise<string> {
  const id = generateUUIDv1()
  await qx.result(
    `
    INSERT INTO public.integrations (id, platform, status, "tenantId", "createdAt", "updatedAt", "deletedAt")
    VALUES ($(id), 'github', 'done', $(tenantId), NOW(), NOW(), $(deletedAt)::timestamptz)
    `,
    { id, tenantId: DEFAULT_TENANT_ID, deletedAt: overrides.deletedAt ?? null },
  )
  return id
}

async function createSyncUnit(
  qx: QueryExecutor,
  integrationId: string,
  overrides: {
    channelName: string
    syncName: string
    status?: string
    emitEnabled?: boolean
    watermark?: Record<string, unknown> | null
    platform?: string
  },
): Promise<string> {
  const id = generateUUIDv1()
  await qx.result(
    `
    INSERT INTO integration.sync_units
      (id, "integrationId", platform, "channelId", "channelName", "syncName", status, "emitEnabled", watermark)
    VALUES
      ($(id), $(integrationId), $(platform), $(channelName), $(channelName), $(syncName), $(status), $(emitEnabled), $(watermark)::jsonb)
    `,
    {
      id,
      integrationId,
      platform: overrides.platform ?? 'github',
      channelName: overrides.channelName,
      syncName: overrides.syncName,
      status: overrides.status ?? 'active',
      emitEnabled: overrides.emitEnabled ?? false,
      watermark: overrides.watermark === undefined ? null : JSON.stringify(overrides.watermark),
    },
  )
  return id
}

describe('listShadowDiffUnits', () => {
  test('returns only active, shadow-mode units in the incremental phase', async ({ qx }) => {
    const integrationId = await createIntegration(qx)

    const eligibleId = await createSyncUnit(qx, integrationId, {
      channelName: 'https://github.com/kubernetes/kubernetes',
      syncName: 'issues',
      watermark: { phase: 'incremental' },
    })

    await createSyncUnit(qx, integrationId, {
      channelName: 'https://github.com/kubernetes/kubernetes',
      syncName: 'forks',
      emitEnabled: true,
      watermark: { phase: 'incremental' },
    })

    await createSyncUnit(qx, integrationId, {
      channelName: 'https://github.com/torvalds/linux',
      syncName: 'issues',
      status: 'paused',
      watermark: { phase: 'incremental' },
    })

    await createSyncUnit(qx, integrationId, {
      channelName: 'https://github.com/rust-lang/rust',
      syncName: 'issues',
      watermark: { phase: 'backfill' },
    })

    await createSyncUnit(qx, integrationId, {
      channelName: 'https://github.com/nodejs/node',
      syncName: 'issues',
      watermark: null,
    })

    await createSyncUnit(qx, integrationId, {
      channelName: 'dummy-channel',
      syncName: 'issues',
      watermark: { phase: 'incremental' },
      platform: 'dummy',
    })

    const result = await listShadowDiffUnits(qx)

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      id: eligibleId,
      integrationId,
      channelName: 'https://github.com/kubernetes/kubernetes',
      syncName: 'issues',
    })
  })

  test('excludes units whose parent integration was soft-deleted', async ({ qx }) => {
    const deletedIntegrationId = await createIntegration(qx, {
      deletedAt: '2026-09-01T00:00:00.000Z',
    })

    await createSyncUnit(qx, deletedIntegrationId, {
      channelName: 'https://github.com/kubernetes/kubernetes',
      syncName: 'issues',
      watermark: { phase: 'incremental' },
    })

    const result = await listShadowDiffUnits(qx)

    expect(result).toHaveLength(0)
  })
})

async function readUnit(
  qx: QueryExecutor,
  integrationId: string,
  syncName: string,
): Promise<{
  emitEnabled: boolean
  nextRunAt: Date
  watermark: Record<string, unknown> | null
  consecutiveFailures: number
  channelName: string
  delaySeconds: number
}> {
  return qx.selectOne(
    `
    SELECT "emitEnabled", "nextRunAt", watermark, "consecutiveFailures", "channelName",
           EXTRACT(EPOCH FROM ("nextRunAt" - now()))::float8 AS "delaySeconds"
    FROM integration.sync_units
    WHERE "integrationId" = $(integrationId) AND "syncName" = $(syncName)
    `,
    { integrationId, syncName },
  )
}

describe('upsertSyncUnits', () => {
  const base = { platform: 'github', channelId: 'repo-1', channelName: 'org/repo' }

  test('defaults to shadow mode and a 10-900s random start when new fields are omitted', async ({
    qx,
  }) => {
    const integrationId = await createIntegration(qx)

    await upsertSyncUnits(qx, [{ ...base, integrationId, syncName: 'issues' }])

    const unit = await readUnit(qx, integrationId, 'issues')
    expect(unit.emitEnabled).toBe(false)
    expect(unit.delaySeconds).toBeGreaterThanOrEqual(9)
    expect(unit.delaySeconds).toBeLessThanOrEqual(900)
  })

  test('applies emitEnabled and initialDelaySeconds on insert', async ({ qx }) => {
    const integrationId = await createIntegration(qx)

    await upsertSyncUnits(qx, [
      { ...base, integrationId, syncName: 'issues', emitEnabled: true, initialDelaySeconds: 0 },
      { ...base, integrationId, syncName: 'forks' },
    ])

    const issues = await readUnit(qx, integrationId, 'issues')
    expect(issues.emitEnabled).toBe(true)
    expect(Math.abs(issues.delaySeconds)).toBeLessThan(5)
    const forks = await readUnit(qx, integrationId, 'forks')
    expect(forks.emitEnabled).toBe(false)
    expect(forks.delaySeconds).toBeGreaterThanOrEqual(9)
  })

  test('re-running without a watermark leaves emitEnabled, nextRunAt, watermark and failures untouched', async ({
    qx,
  }) => {
    const integrationId = await createIntegration(qx)
    await upsertSyncUnits(qx, [{ ...base, integrationId, syncName: 'issues' }])
    await qx.result(
      `
      UPDATE integration.sync_units
      SET "emitEnabled" = true, "nextRunAt" = '2030-01-01T00:00:00Z',
          watermark = '{"phase":"incremental"}'::jsonb, "consecutiveFailures" = 3
      WHERE "integrationId" = $(integrationId)
      `,
      { integrationId },
    )

    await upsertSyncUnits(qx, [
      {
        ...base,
        integrationId,
        syncName: 'issues',
        channelName: 'org/renamed',
        emitEnabled: false,
        initialDelaySeconds: 0,
      },
    ])

    const unit = await readUnit(qx, integrationId, 'issues')
    expect(unit).toMatchObject({
      emitEnabled: true,
      watermark: { phase: 'incremental' },
      consecutiveFailures: 3,
      channelName: 'org/renamed',
    })
    expect(new Date(unit.nextRunAt).toISOString()).toBe('2030-01-01T00:00:00.000Z')
  })

  test('re-running with a watermark replaces the stored watermark', async ({ qx }) => {
    const integrationId = await createIntegration(qx)
    await upsertSyncUnits(qx, [
      { ...base, integrationId, syncName: 'issues', watermark: { phase: 'backfill' } },
    ])

    await upsertSyncUnits(qx, [
      { ...base, integrationId, syncName: 'issues', watermark: { phase: 'incremental' } },
    ])

    expect((await readUnit(qx, integrationId, 'issues')).watermark).toEqual({
      phase: 'incremental',
    })
  })
})
