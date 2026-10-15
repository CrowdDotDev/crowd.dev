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
  findIntegrationPlatformsByIds,
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

  test('status count skips only the segment-less octolens anchor', async ({ qx }) => {
    const { groupId, connectedId } = await createTree(qx)
    const doneCount = async (platform: string) => {
      const counts = await fetchGlobalIntegrationsStatusCount(qx, platform, null)
      return Number(counts.find((s) => s.status === 'done')?.count ?? 0)
    }
    const githubBefore = await doneCount('github')
    const octolensBefore = await doneCount('octolens')

    await createIntegration(qx, 'github', null)
    await createIntegration(qx, 'github', connectedId)
    await createIntegration(qx, 'octolens', null)
    await createIntegration(qx, 'octolens', connectedId)

    expect(await doneCount('github')).toBe(githubBefore + 2)
    expect(await doneCount('octolens')).toBe(octolensBefore + 1)

    const scoped = await fetchGlobalIntegrationsStatusCount(qx, 'octolens', groupId)
    expect(scoped).toEqual([{ status: 'done', count: expect.anything() }])
    expect(Number(scoped[0].count)).toBe(1)
  })

  test('list and count never include the segment-less anchor', async ({ qx }) => {
    const { connectedId } = await createTree(qx)
    const subprojectIntegration = await createIntegration(qx, 'octolens', connectedId)
    const anchor = await createIntegration(qx, 'octolens', null)

    const listed = await fetchGlobalIntegrations(qx, ['done'], 'octolens', '', 1000, 0, null)
    const [{ count }] = await fetchGlobalIntegrationsCount(qx, ['done'], 'octolens', '', null)

    const listedIds = listed.map((i) => i.id)
    expect(listedIds).toContain(subprojectIntegration)
    expect(listedIds).not.toContain(anchor)
    expect(Number(count)).toBe(listed.length)
  })
})

describe('findIntegrationPlatformsByIds', () => {
  test('returns the distinct platforms of the given ids only', async ({ qx }) => {
    const { connectedId } = await createTree(qx)
    const github = await createIntegration(qx, 'github', connectedId)
    const octolens = await createIntegration(qx, 'octolens', null)
    await createIntegration(qx, 'gitlab', connectedId)

    expect(await findIntegrationPlatformsByIds(qx, [])).toEqual([])
    expect(await findIntegrationPlatformsByIds(qx, [github, github])).toEqual(['github'])
    expect((await findIntegrationPlatformsByIds(qx, [github, octolens])).sort()).toEqual([
      'github',
      'octolens',
    ])
    expect(await findIntegrationPlatformsByIds(qx, [generateUUIDv1()])).toEqual([])
  })
})
