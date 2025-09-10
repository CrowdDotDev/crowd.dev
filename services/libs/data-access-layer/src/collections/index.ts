import { QueryFilter } from '../query'
import { QueryExecutor } from '../queryExecutor'
import { ICreateRepositoryGroup } from '../repositoryGroups'
import {
  QueryResult,
  injectSoftDeletionCriteria,
  prepareBulkInsert,
  prepareInsert,
  queryTable,
  queryTableById,
  updateTableById,
} from '../utils'
import { QueryOptions } from '../utils'

export interface ICreateCollection {
  categoryId: string
  description?: string
  name: string
  slug?: string
  starred: boolean
}

export interface ICollection extends ICreateCollection {
  id: string
  createdAt: string
  updatedAt: string
}

export interface ICreateCollectionWithProjects extends ICreateCollection {
  projects?: {
    id: string
    starred: boolean
  }[]
}

export interface IInsightsProject {
  id: string
  name: string
  description?: string
  segmentId: string
  createdAt: string
  updatedAt: string
  slug: string
  isLF: boolean
  enabled: boolean
  keywords: string[]
  logoUrl: string
  organizationId: string
  website: string
  github: string
  linkedin: string
  twitter: string
  widgets: string[]
  repositories:
    | {
        platform: string
        url: string
      }[]
    | string[]
  repositoryGroups: ICreateRepositoryGroup[]
}

export interface ICreateInsightsProject extends IInsightsProject {
  collections: string[]
  starred?: boolean
}

export interface ICollectionInsightProject {
  id: string
  collectionId: string
  insightsProjectId: string
  starred: boolean
  createdAt: string
  updatedAt: string
}

export enum CollectionField {
  CATEGORY_ID = 'categoryId',
  CREATED_AT = 'createdAt',
  DESCRIPTION = 'description',
  ID = 'id',
  NAME = 'name',
  SLUG = 'slug',
  STARRED = 'starred',
  UPDATED_AT = 'updatedAt',
  DELETED_AT = 'deletedAt',
}

export async function queryCollections<T extends CollectionField>(
  qx: QueryExecutor,
  opts: QueryOptions<T>,
): Promise<QueryResult<T>[]> {
  opts.filter = injectSoftDeletionCriteria(opts.filter)
  return queryTable(qx, 'collections', Object.values(CollectionField), opts)
}

export async function countCollections(qx: QueryExecutor, filter: QueryFilter): Promise<number> {
  filter = injectSoftDeletionCriteria(filter)
  const result = await queryTable(qx, 'collections', Object.values(CollectionField), {
    filter,
    fields: 'count',
  })
  return result[0]['count']
}

export async function queryCollectionById<T extends CollectionField>(
  qx: QueryExecutor,
  id: string,
  fields: T[],
): Promise<QueryResult<T>> {
  return queryTableById(qx, 'collections', Object.values(CollectionField), id, fields)
}

export async function deleteCollection(qx: QueryExecutor, id: string) {
  return qx.result(
    `
      UPDATE collections
      SET "deletedAt" = NOW(),
          "updatedAt" = NOW()
      WHERE id = $(id)
    `,
    { id },
  )
}

export async function createCollection(
  qx: QueryExecutor,
  collection: ICreateCollection,
): Promise<ICollection> {
  return qx.selectOne(
    `
      INSERT INTO collections (name, description, slug, "categoryId", starred)
      VALUES ($(name), $(description), $(slug), $(categoryId), $(starred))
      RETURNING *
    `,
    collection,
  )
}

export async function updateCollection(
  qx: QueryExecutor,
  id: string,
  collection: Partial<ICreateCollection>,
): Promise<ICollection> {
  return updateTableById(qx, 'collections', id, Object.values(CollectionField), collection)
}

export enum InsightsProjectField {
  CREATED_AT = 'createdAt',
  DESCRIPTION = 'description',
  ENABLED = 'enabled',
  GITHUB = 'github',
  ID = 'id',
  IS_LF = 'isLF',
  KEYWORDS = 'keywords',
  LINKEDIN = 'linkedin',
  LOGO_URL = 'logoUrl',
  NAME = 'name',
  ORGANIZATION_ID = 'organizationId',
  REPOSITORIES = 'repositories',
  SEARCH_KEYWORDS = 'searchKeywords',
  SEGMENT_ID = 'segmentId',
  SLUG = 'slug',
  TWITTER = 'twitter',
  UPDATED_AT = 'updatedAt',
  WEBSITE = 'website',
  WIDGETS = 'widgets',
  DELETED_AT = 'deletedAt',
}

export async function queryInsightsProjects<T extends InsightsProjectField>(
  qx: QueryExecutor,
  opts: QueryOptions<T>,
): Promise<QueryResult<T>[]> {
  opts.filter = injectSoftDeletionCriteria(opts.filter)
  return queryTable(qx, 'insightsProjects', Object.values(InsightsProjectField), opts)
}

export async function createInsightsProject(
  qx: QueryExecutor,
  insightProject: Partial<IInsightsProject>,
) {
  return qx.selectOne(
    prepareInsert(
      'insightsProjects',
      Object.values(InsightsProjectField),
      prepareProject(insightProject),
    ),
  )
}

export async function disconnectProjectsAndCollections(
  qx: QueryExecutor,
  {
    collectionId,
    insightsProjectId,
  }: {
    collectionId?: string
    insightsProjectId?: string
  },
) {
  return qx.result(
    `
      DELETE FROM "collectionsInsightsProjects"
      WHERE 1=1
        ${collectionId ? `AND "collectionId" = $(collectionId)` : ''}
        ${insightsProjectId ? `AND "insightsProjectId" = $(insightsProjectId)` : ''}
    `,
    { collectionId, insightsProjectId },
  )
}

export async function connectProjectsAndCollections(
  qx: QueryExecutor,
  connections: {
    insightsProjectId: string
    collectionId: string
    starred: boolean
  }[],
  onConflict?: string,
) {
  if (connections.length === 0) {
    return
  }

  return qx.result(
    prepareBulkInsert(
      'collectionsInsightsProjects',
      ['collectionId', 'insightsProjectId', 'starred'],
      connections,
      onConflict ?? null,
    ),
  )
}

export async function findCollectionProjectConnections(
  qx: QueryExecutor,
  {
    collectionIds,
    insightsProjectIds,
  }: {
    collectionIds?: string[]
    insightsProjectIds?: string[]
  },
): Promise<ICollectionInsightProject[]> {
  if (!collectionIds && !insightsProjectIds) {
    return []
  }

  return qx.select(
    `
      SELECT *
      FROM "collectionsInsightsProjects"
      WHERE 1=1
        ${collectionIds ? `AND "collectionId" IN ($(collectionIds:csv))` : ''}
        ${insightsProjectIds ? `AND "insightsProjectId" IN ($(insightsProjectIds:csv))` : ''}
    `,
    { collectionIds, insightsProjectIds },
  )
}

export async function countInsightsProjects(
  qx: QueryExecutor,
  filter: QueryFilter,
): Promise<number> {
  filter = injectSoftDeletionCriteria(filter)
  const result = await queryTable(qx, 'insightsProjects', Object.values(InsightsProjectField), {
    filter,
    fields: 'count',
  })
  return result[0]['count']
}

export async function deleteInsightsProject(qx: QueryExecutor, id: string) {
  return qx.result(
    `
      UPDATE "insightsProjects"
      SET "deletedAt" = NOW(),
          "updatedAt" = NOW()
      WHERE id = $(id)
    `,
    { id },
  )
}

export async function queryInsightsProjectById<T extends InsightsProjectField>(
  qx: QueryExecutor,
  id: string,
  fields: T[],
): Promise<QueryResult<T>> {
  return queryTableById(qx, 'insightsProjects', Object.values(InsightsProjectField), id, fields)
}

export async function updateInsightsProject(
  qx: QueryExecutor,
  id: string,
  project: Partial<ICreateInsightsProject>,
) {
  const updated = await updateTableById(
    qx,
    'insightsProjects',
    id,
    Object.values(InsightsProjectField),
    prepareProject(project),
  )

  if (!updated) {
    throw new Error(`Update failed or project with id ${id} not found`)
  }

  return updated as IInsightsProject
}

function prepareProject(project: Partial<ICreateInsightsProject>) {
  const toUpdate: Record<string, unknown> = {
    ...project,
  }
  return toUpdate
}

export async function findBySlug(qx: QueryExecutor, slug: string) {
  const collections = await queryCollections(qx, {
    filter: {
      slug: { eq: slug },
    },
    fields: Object.values(CollectionField),
  })
  return collections
}

export async function upsertSegmentRepositories(
  qx: QueryExecutor,
  {
    insightsProjectId,
    repositories,
    segmentId,
  }: {
    insightsProjectId: string
    repositories: string[]
    segmentId: string
  },
) {
  if (repositories.length === 0) {
    return
  }

  return qx.result(
    `
    WITH "input" AS (
      SELECT DISTINCT unnest(ARRAY[$(repositories:csv)]::text[]) AS "repository"
    )
    INSERT INTO "segmentRepositories" ("repository", "segmentId", "insightsProjectId")
    SELECT "repository", $(segmentId), $(insightsProjectId)
    FROM "input"
    ON CONFLICT ("repository")
    DO UPDATE SET
      "segmentId" = EXCLUDED."segmentId",
      "insightsProjectId" = EXCLUDED."insightsProjectId";
    `,
    { insightsProjectId, repositories, segmentId },
  )
}

export async function deleteSegmentRepositories(
  qx: QueryExecutor,
  {
    segmentId,
  }: {
    segmentId: string
  },
) {
  return qx.result(
    `
    DELETE FROM "segmentRepositories"
    WHERE "segmentId" = '${segmentId}'
     `,
    { segmentId },
  )
}

export async function deleteMissingSegmentRepositories(
  qx: QueryExecutor,
  {
    segmentId,
    repositories,
  }: {
    segmentId: string
    repositories: string[]
  },
) {
  return qx.result(
    `
    DELETE FROM "segmentRepositories"
    WHERE "segmentId" = '${segmentId}'
      AND ${repositories.length > 0 ? `"repository" != ALL(ARRAY[${repositories.map((repo) => `'${repo}'`).join(', ')}])` : 'TRUE'};
    `,
    { segmentId, repositories },
  )
}
