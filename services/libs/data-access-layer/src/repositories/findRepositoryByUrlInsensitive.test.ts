import { test as base, describe, expect } from 'vitest'

import { DEFAULT_TENANT_ID, generateUUIDv1 } from '@crowd/common'
import type { QueryExecutor } from '@crowd/database'
import { withQx } from '@crowd/test-kit/db'
import { createSegments } from '@crowd/test-kit/factories'

import { createInsightsProject } from '../collections'
import { findRepositoryByUrlInsensitive, insertRepositories } from './index'

const test = withQx(base)

async function createIntegration(qx: QueryExecutor): Promise<string> {
  const id = generateUUIDv1()
  await qx.result(
    `
    INSERT INTO public.integrations (id, platform, status, "tenantId", "createdAt", "updatedAt")
    VALUES ($(id), 'github-nango', 'done', $(tenantId), NOW(), NOW())
    `,
    { id, tenantId: DEFAULT_TENANT_ID },
  )
  return id
}

async function createRepository(qx: QueryExecutor, url: string): Promise<string> {
  const [segmentGroup] = (
    await createSegments(qx, [{ name: generateUUIDv1(), slug: generateUUIDv1() }])
  ).projectGroups
  const insightsProject = await createInsightsProject(qx, {
    name: generateUUIDv1(),
    slug: generateUUIDv1(),
    isLF: false,
  })
  const sourceIntegrationId = await createIntegration(qx)
  await insertRepositories(qx, [
    {
      id: generateUUIDv1(),
      url,
      segmentId: segmentGroup.row.id,
      gitIntegrationId: await createIntegration(qx),
      sourceIntegrationId,
      insightsProjectId: insightsProject.id,
    },
  ])
  return sourceIntegrationId
}

describe('findRepositoryByUrlInsensitive', () => {
  test('finds a live repository whatever the url casing and ignores soft-deleted rows', async ({
    qx,
  }) => {
    const sourceIntegrationId = await createRepository(qx, 'https://github.com/Acme/Widget')
    await createRepository(qx, 'https://github.com/acme/gone')
    await qx.result(
      `UPDATE public.repositories SET "deletedAt" = NOW() WHERE url = 'https://github.com/acme/gone'`,
    )

    await expect(
      findRepositoryByUrlInsensitive(qx, 'https://github.com/acme/widget'),
    ).resolves.toMatchObject({ url: 'https://github.com/Acme/Widget', sourceIntegrationId })
    await expect(
      findRepositoryByUrlInsensitive(qx, 'https://github.com/ACME/GONE'),
    ).resolves.toBeNull()
    await expect(
      findRepositoryByUrlInsensitive(qx, 'https://github.com/acme/missing'),
    ).resolves.toBeNull()
  })
})
