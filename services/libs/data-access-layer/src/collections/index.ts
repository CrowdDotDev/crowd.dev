import { QueryFilter } from '../query'
import { QueryExecutor } from '../queryExecutor'
import { QueryResult, prepareBulkInsert, queryTable, queryTableById } from '../utils'
import { QueryOptions } from '../utils'

export interface ICreateCollection {
  name: string
  description?: string
  isLF: boolean
}

export interface ICollection extends ICreateCollection {
  id: string
  createdAt: string
  updatedAt: string
}

export interface ICreateCollectionWithProjects extends ICreateCollection {
  projects: {
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
  IS_LF = 'isLF',
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
      INSERT INTO collections (name, description, "isLF")
      VALUES ($(name), $(description), $(isLF))
      RETURNING *
    `,
    collection,
  )
}

export enum InsightsProjectField {
  ID = 'id',
  NAME = 'name',
  DESCRIPTION = 'description',
  SEGMENT_ID = 'segmentId',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export async function queryInsightsProjects<T extends InsightsProjectField>(
  qx: QueryExecutor,
  opts: QueryOptions<T>,
): Promise<QueryResult<T>[]> {
  return queryTable(qx, 'insightsProjects', Object.values(InsightsProjectField), opts)
}

export async function createInsightsProject(qx: QueryExecutor, insightProject: IInsightsProject) {
  return qx.selectOne(
    `
      INSERT INTO "insightsProjects" (name, description, "segmentId")
      VALUES ($(name), $(description), $(segmentId))
      RETURNING *
    `,
    {
      name: insightProject.name,
      description: insightProject.description,
      segmentId: insightProject.segmentId,
    },
  )
}

export async function addInsightsProjectsToCollection(
  qx: QueryExecutor,
  collectionId: string,
  projects: {
    id: string
    starred: boolean
  }[],
) {
  return qx.result(
    prepareBulkInsert(
      'collectionsInsightsProjects',
      ['collectionId', 'insightsProjectId', 'starred'],
      projects.map((p) => ({
        collectionId,
        insightsProjectId: p.id,
        starred: p.starred,
      })),
    ),
  )
}

export async function queryInsightsProjectsByCollectionIds(
  qx: QueryExecutor,
  collectionIds: string[],
): Promise<ICollectionInsightProject[]> {
  return qx.select(
    `
      SELECT *
      FROM "collectionsInsightsProjects"
      WHERE "collectionId" IN ($(collectionIds:csv))
    `,
    { collectionIds },
  )
}
