import { QueryExecutor } from '../queryExecutor'

/**
 * Repository entity from the public.repositories table
 */
export interface IRepository {
  id: string
  url: string
  segmentId: string
  gitIntegrationId: string
  sourceIntegrationId: string
  insightsProjectId: string
  archived: boolean
  forkedFrom: string | null
  excluded: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  lastArchivedCheckAt: string | null
}

export interface ICreateRepository {
  id: string
  url: string
  segmentId: string
  gitIntegrationId: string
  sourceIntegrationId: string
  insightsProjectId: string
  archived?: boolean
  forkedFrom?: string | null
  excluded?: boolean
}

/**
 * Bulk inserts repositories into public.repositories and git.repositoryProcessing
 * @param qx - Query executor (should be transactional)
 * @param repositories - Array of repositories to insert
 */
export async function insertRepositories(
  qx: QueryExecutor,
  repositories: ICreateRepository[],
): Promise<void> {
  if (repositories.length === 0) {
    return
  }

  const values = repositories.map((repo) => ({
    id: repo.id,
    url: repo.url,
    segmentId: repo.segmentId,
    gitIntegrationId: repo.gitIntegrationId,
    sourceIntegrationId: repo.sourceIntegrationId,
    insightsProjectId: repo.insightsProjectId,
    archived: repo.archived ?? false,
    forkedFrom: repo.forkedFrom ?? null,
    excluded: repo.excluded ?? false,
  }))

  await qx.result(
    `
    INSERT INTO public.repositories (
      id,
      url,
      "segmentId",
      "gitIntegrationId",
      "sourceIntegrationId",
      "insightsProjectId",
      archived,
      "forkedFrom",
      excluded,
      "createdAt",
      "updatedAt"
    )
    SELECT
      v.id::uuid,
      v.url,
      v."segmentId"::uuid,
      v."gitIntegrationId"::uuid,
      v."sourceIntegrationId"::uuid,
      v."insightsProjectId"::uuid,
      v.archived::boolean,
      v."forkedFrom",
      v.excluded::boolean,
      NOW(),
      NOW()
    FROM jsonb_to_recordset($(values)::jsonb) AS v(
      id text,
      url text,
      "segmentId" text,
      "gitIntegrationId" text,
      "sourceIntegrationId" text,
      "insightsProjectId" text,
      archived boolean,
      "forkedFrom" text,
      excluded boolean
    )
    `,
    { values: JSON.stringify(values) },
  )

  // Insert into git.repositoryProcessing to sync into git integration worker
  const repositoryIds = repositories.map((repo) => ({ repositoryId: repo.id }))
  await qx.result(
    `
    INSERT INTO git."repositoryProcessing" (
      "repositoryId",
      "createdAt",
      "updatedAt"
    )
    SELECT
      v."repositoryId"::uuid,
      NOW(),
      NOW()
    FROM jsonb_to_recordset($(repositoryIds)::jsonb) AS v(
      "repositoryId" text
    )
    `,
    { repositoryIds: JSON.stringify(repositoryIds) },
  )
}

/**
 * Get repositories by source integration ID
 * @param qx - Query executor
 * @param sourceIntegrationId - The source integration ID
 * @returns Array of repositories for the given integration (excluding soft-deleted)
 */
export async function getRepositoriesBySourceIntegrationId(
  qx: QueryExecutor,
  sourceIntegrationId: string,
): Promise<IRepository[]> {
  return qx.select(
    `
    SELECT
      id,
      url,
      "segmentId",
      "gitIntegrationId",
      "sourceIntegrationId",
      "insightsProjectId",
      archived,
      "forkedFrom",
      excluded,
      "createdAt",
      "updatedAt",
      "deletedAt",
      "lastArchivedCheckAt"
    FROM public.repositories
    WHERE "sourceIntegrationId" = $(sourceIntegrationId)
      AND "deletedAt" IS NULL
    `,
    { sourceIntegrationId },
  )
}

/**
 * Get git repository IDs by URLs from git.repositories table
 * @param qx - Query executor
 * @param urls - Array of repository URLs
 * @returns Map of URL to repository ID
 */
export async function getGitRepositoryIdsByUrl(
  qx: QueryExecutor,
  urls: string[],
): Promise<Map<string, string>> {
  if (urls.length === 0) {
    return new Map()
  }

  const results = await qx.select(
    `
    SELECT id, url
    FROM git.repositories
    WHERE url IN ($(urls:csv))
    `,
    { urls },
  )

  return new Map(results.map((row: { id: string; url: string }) => [row.url, row.id]))
}

/**
 * Get repositories by their URLs
 * @param qx - Query executor
 * @param repoUrls - Array of repository URLs to search for
 * @param includeSoftDeleted - Whether to include soft-deleted repositories (default: false)
 * @returns Array of repositories matching the given URLs
 */
export async function getRepositoriesByUrl(
  qx: QueryExecutor,
  repoUrls: string[],
  includeSoftDeleted = false,
): Promise<IRepository[]> {
  if (repoUrls.length === 0) {
    return []
  }

  const deletedFilter = includeSoftDeleted ? '' : 'AND "deletedAt" IS NULL'

  return qx.select(
    `
    SELECT
      id,
      url,
      "segmentId",
      "gitIntegrationId",
      "sourceIntegrationId",
      "insightsProjectId",
      archived,
      "forkedFrom",
      excluded,
      "createdAt",
      "updatedAt",
      "deletedAt",
      "lastArchivedCheckAt"
    FROM public.repositories
    WHERE url IN ($(repoUrls:csv))
    ${deletedFilter}
    `,
    { repoUrls },
  )
}

/**
 * Soft deletes repositories by setting deletedAt = NOW()
 * @param qx - Query executor
 * @param urls - Array of repository URLs to soft delete
 * @returns Number of rows affected
 */
export async function softDeleteRepositories(qx: QueryExecutor, urls: string[]): Promise<number> {
  if (urls.length === 0) {
    return 0
  }

  return qx.result(
    `
    UPDATE public.repositories
    SET "deletedAt" = NOW(), "updatedAt" = NOW()
    WHERE url IN ($(urls:csv))
      AND "deletedAt" IS NULL
    `,
    { urls },
  )
}

/**
 * Restores soft-deleted and/or updated repositories and resets their processing state
 * Updates fields in public.repositories and resets git.repositoryProcessing for re-onboarding
 * @param qx - Query executor
 * @param repositories - Array of repositories with url (required) and optional fields to update
 */
export async function restoreRepositories(
  qx: QueryExecutor,
  repositories: Partial<ICreateRepository>[],
): Promise<void> {
  if (repositories.length === 0) {
    return
  }

  const urls = repositories.map((repo) => repo.url).filter(Boolean) as string[]
  if (urls.length === 0) {
    return
  }

  const values = repositories.map((repo) => ({
    url: repo.url,
    segmentId: repo.segmentId ?? null,
    gitIntegrationId: repo.gitIntegrationId ?? null,
    sourceIntegrationId: repo.sourceIntegrationId ?? null,
    insightsProjectId: repo.insightsProjectId ?? null,
    archived: repo.archived ?? null,
    forkedFrom: repo.forkedFrom ?? null,
    excluded: repo.excluded ?? null,
  }))

  await qx.result(
    `
    UPDATE public.repositories r
    SET
      "segmentId" = COALESCE(v."segmentId"::uuid, r."segmentId"),
      "gitIntegrationId" = COALESCE(v."gitIntegrationId"::uuid, r."gitIntegrationId"),
      "sourceIntegrationId" = COALESCE(v."sourceIntegrationId"::uuid, r."sourceIntegrationId"),
      "insightsProjectId" = COALESCE(v."insightsProjectId"::uuid, r."insightsProjectId"),
      archived = COALESCE(v.archived::boolean, r.archived),
      "forkedFrom" = COALESCE(v."forkedFrom", r."forkedFrom"),
      excluded = COALESCE(v.excluded::boolean, r.excluded),
      "deletedAt" = NULL,
      "updatedAt" = NOW()
    FROM jsonb_to_recordset($(values)::jsonb) AS v(
      url text,
      "segmentId" text,
      "gitIntegrationId" text,
      "sourceIntegrationId" text,
      "insightsProjectId" text,
      archived boolean,
      "forkedFrom" text,
      excluded boolean
    )
    WHERE r.url = v.url
    `,
    { values: JSON.stringify(values) },
  )

  // Reset git.repositoryProcessing for git re-onboarding
  await qx.result(
    `
    UPDATE git."repositoryProcessing" rp
    SET
      "lastProcessedAt" = NULL,
      "lastProcessedCommit" = NULL,
      "lastMaintainerRunAt" = NULL,
      branch = NULL,
      "lockedAt" = NULL,
      state = 'pending',
      "updatedAt" = NOW()
    FROM public.repositories r
    WHERE rp."repositoryId" = r.id
      AND r.url IN ($(urls:csv))
    `,
    { urls },
  )
}
