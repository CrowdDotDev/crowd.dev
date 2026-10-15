import { test as base, describe, expect } from 'vitest'

import { DEFAULT_TENANT_ID, generateUUIDv1 } from '@crowd/common'
import type { QueryExecutor } from '@crowd/database'
import { withQx } from '@crowd/test-kit/db'
import { createSegments } from '@crowd/test-kit/factories'

import {
  fetchGlobalIntegrations,
  fetchGlobalIntegrationsCount,
  fetchGlobalIntegrationsStatusCount,
  fetchGlobalNotConnectedIntegrations,
  fetchGlobalNotConnectedIntegrationsCount,
} from './index'

const test = withQx(base)

async function createIntegration(
  qx: QueryExecutor,
  platform: string,
  segmentId: string | null,
): Promise<string> {
  const id = generateUUIDv1()
  await qx.result(
    `
    INSERT INTO public.integrations (id, platform, status, "tenantId", "segmentId", "createdAt", "updatedAt")
    VALUES ($(id), $(platform), 'done', $(tenantId), $(segmentId), NOW(), NOW())
    `,
    { id, platform, tenantId: DEFAULT_TENANT_ID, segmentId },
  )
  return id
}

async function createTree(qx: QueryExecutor) {
  const node = () => ({ name: generateUUIDv1(), slug: generateUUIDv1() })
  const [group] = (
    await createSegments(qx, [
      { ...node(), projects: [{ ...node(), subprojects: [node(), node()] }] },
    ])
  ).projectGroups
  const [connected, unconnected] = group.projects[0].subprojects
  return { groupId: group.row.id, connectedId: connected.id, unconnectedId: unconnected.id }
}

describe('global integrations with auto-managed octolens integrations', () => {
  test('not-connected list and count never report octolens', async ({ qx }) => {
    const { groupId, connectedId, unconnectedId } = await createTree(qx)
    await createIntegration(qx, 'github', connectedId)
    await createIntegration(qx, 'octolens', connectedId)
    await createIntegration(qx, 'octolens', null)

    const rows = await fetchGlobalNotConnectedIntegrations(qx, null, '', 1000, 0, groupId)
    const [{ count }] = await fetchGlobalNotConnectedIntegrationsCount(qx, null, '', groupId)

    expect(rows.map((r) => r.platform)).not.toContain('octolens')
    expect(rows).toContainEqual(
      expect.objectContaining({ platform: 'github', segmentId: unconnectedId }),
    )
    expect(Number(count)).toBe(rows.length)
  })

  test('status count matches the list and ignores the segment-less anchor', async ({ qx }) => {
    const { groupId, connectedId } = await createTree(qx)
    const subprojectIntegration = await createIntegration(qx, 'octolens', connectedId)
    const anchor = await createIntegration(qx, 'octolens', null)

    const listed = await fetchGlobalIntegrations(qx, ['done'], 'octolens', '', 1000, 0, null)
    const [{ count: listCount }] = await fetchGlobalIntegrationsCount(
      qx,
      ['done'],
      'octolens',
      '',
      null,
    )
    const statusCounts = await fetchGlobalIntegrationsStatusCount(qx, 'octolens', null)
    const doneCount = Number(statusCounts.find((s) => s.status === 'done')?.count ?? 0)

    const listedIds = listed.map((i) => i.id)
    expect(listedIds).toContain(subprojectIntegration)
    expect(listedIds).not.toContain(anchor)
    expect(Number(listCount)).toBe(listed.length)
    expect(doneCount).toBe(listed.length)

    const scoped = await fetchGlobalIntegrationsStatusCount(qx, 'octolens', groupId)
    expect(scoped).toEqual([{ status: 'done', count: expect.anything() }])
    expect(Number(scoped[0].count)).toBe(1)
  })
})
