import { QueryFilter } from '../query'
import { QueryExecutor } from '../queryExecutor'
import {
  QueryResult,
  prepareBulkInsert,
  prepareInsert,
  queryTable,
  queryTableById,
  updateTableById,
} from '../utils'
import { QueryOptions } from '../utils'

export interface ICreateCollection {
  name: string
  description?: string
  categoryId: string
  slug: string
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
  repositories: {
    platform: string
    url: string
  }[]
}

export interface ICreateInsightsProject extends IInsightsProject {
  collections: string[]
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
  ID = 'id',
  NAME = 'name',
  DESCRIPTION = 'description',
  CATEGORY_ID = 'categoryId',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export async function queryCollections<T extends CollectionField>(
  qx: QueryExecutor,
  opts: QueryOptions<T>,
): Promise<QueryResult<T>[]> {
  return queryTable(qx, 'collections', Object.values(CollectionField), opts)
}

export async function countCollections(qx: QueryExecutor, filter: QueryFilter): Promise<number> {
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
  return qx.result('DELETE FROM collections WHERE id = $(id)', { id })
}

export async function createCollection(
  qx: QueryExecutor,
  collection: ICreateCollection,
): Promise<ICollection> {
  return qx.selectOne(
    `
      INSERT INTO collections (name, description, slug, "categoryId")
      VALUES ($(name), $(description), $(slug), $(categoryId))
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
  ID = 'id',
  NAME = 'name',
  DESCRIPTION = 'description',
  SEGMENT_ID = 'segmentId',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  IS_LF = 'isLF',
  ENABLED = 'enabled',
  KEYWORDS = 'keywords',

  LOGO_URL = 'logoUrl',
  ORGANIZATION_ID = 'organizationId',
  WEBSITE = 'website',
  GITHUB = 'github',
  LINKEDIN = 'linkedin',
  TWITTER = 'twitter',
  WIDGETS = 'widgets',
  REPOSITORIES = 'repositories',
  SLUG = 'slug',
}

export async function queryInsightsProjects<T extends InsightsProjectField>(
  qx: QueryExecutor,
  opts: QueryOptions<T>,
): Promise<QueryResult<T>[]> {
  return queryTable(qx, 'insightsProjects', Object.values(InsightsProjectField), opts)
}

export async function createInsightsProject(qx: QueryExecutor, insightProject: IInsightsProject) {
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
) {
  if (connections.length === 0) {
    return
  }

  return qx.result(
    prepareBulkInsert(
      'collectionsInsightsProjects',
      ['collectionId', 'insightsProjectId', 'starred'],
      connections,
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
  const result = await queryTable(qx, 'insightsProjects', Object.values(InsightsProjectField), {
    filter,
    fields: 'count',
  })
  return result[0]['count']
}

export async function deleteInsightsProject(qx: QueryExecutor, id: string) {
  return qx.result(`DELETE FROM "insightsProjects" WHERE id = $(id)`, { id })
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
  return updateTableById(
    qx,
    'insightsProjects',
    id,
    Object.values(InsightsProjectField),
    prepareProject(project),
  )
}

function prepareProject(project: Partial<ICreateInsightsProject>) {
  const toUpdate: Record<string, unknown> = {
    ...project,
  }
  if (project.repositories) {
    toUpdate.repositories =
      project.repositories.length > 0 ? JSON.stringify(project.repositories) : '{}'
  }
  return toUpdate
}
