import { test as base, describe, expect } from 'vitest'

import { DEFAULT_TENANT_ID, generateUUIDv1 } from '@crowd/common'
import type { QueryExecutor } from '@crowd/database'
import { withQx } from '@crowd/test-kit/db'
import { createSegments } from '@crowd/test-kit/factories'

import { createInsightsProject } from '../collections'
import { findTrackedRepoProjects, insertRepositories } from './index'

const test = withQx(base)

async function createIntegration(qx: QueryExecutor): Promise<string> {
  const id = generateUUIDv1()
  await qx.result(
    `
    INSERT INTO public.integrations (id, platform, status, "tenantId", "createdAt", "updatedAt")
    VALUES ($(id), 'github', 'done', $(tenantId), NOW(), NOW())
    `,
    { id, tenantId: DEFAULT_TENANT_ID },
  )
  return id
}

async function createTrackedRepository(
  qx: QueryExecutor,
  overrides: { url: string; projectName: string; projectSlug: string; projectDeleted?: boolean },
): Promise<void> {
  const [segmentGroup] = (
    await createSegments(qx, [{ name: generateUUIDv1(), slug: generateUUIDv1() }])
  ).projectGroups
  const insightsProject = await createInsightsProject(qx, {
    name: overrides.projectName,
    slug: overrides.projectSlug,
    isLF: true,
  })
  const gitIntegrationId = await createIntegration(qx)
  const sourceIntegrationId = await createIntegration(qx)

  await insertRepositories(qx, [
    {
      id: generateUUIDv1(),
      url: overrides.url,
      segmentId: segmentGroup.row.id,
      gitIntegrationId,
      sourceIntegrationId,
      insightsProjectId: insightsProject.id,
    },
  ])

  if (overrides.projectDeleted) {
    await qx.result(`UPDATE "insightsProjects" SET "deletedAt" = NOW() WHERE id = $(id)`, {
      id: insightsProject.id,
    })
  }
}

describe('findTrackedRepoProjects', () => {
  test('returns nothing for an empty input', async ({ qx }) => {
    expect(await findTrackedRepoProjects(qx, [])).toEqual([])
  })

  test('returns the LFX Insights project of a tracked repository, normalizing the stored URL', async ({
    qx,
  }) => {
    await createTrackedRepository(qx, {
      url: 'https://www.GitHub.com/Kubernetes/Kubernetes.git/',
      projectName: 'Kubernetes',
      projectSlug: 'kubernetes',
    })

    expect(
      await findTrackedRepoProjects(qx, [
        'https://github.com/kubernetes/kubernetes',
        'https://github.com/torvalds/linux',
      ]),
    ).toEqual([
      {
        repoUrl: 'https://github.com/kubernetes/kubernetes',
        projectName: 'Kubernetes',
        projectSlug: 'kubernetes',
      },
    ])
  })

  test('ignores repositories whose project was deleted', async ({ qx }) => {
    await createTrackedRepository(qx, {
      url: 'https://github.com/gerritcodereview/gerrit',
      projectName: 'Gerrit',
      projectSlug: 'gerrit',
      projectDeleted: true,
    })

    expect(
      await findTrackedRepoProjects(qx, ['https://github.com/gerritcodereview/gerrit']),
    ).toEqual([])
  })
})
