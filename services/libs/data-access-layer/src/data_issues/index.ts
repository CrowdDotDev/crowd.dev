import { generateUUIDv4 } from '@crowd/common'
import { QueryExecutor } from '../queryExecutor'
import { IDataIssue } from '@crowd/types'
import { QueryTypes } from 'sequelize'
import { QueryResult, queryTableById } from '../utils'

export interface IDbInsertDataIssuePayload {
  entity: string
  profileUrl: string
  dataIssue: string
  dataType: string
  description: string
  githubIssueUrl: string
  createdById: string
}

export enum DataIssueField {
  // meta
  ID = 'id',
  ENTITY = 'entity',
  PROFILE_URL = 'profileUrl',
  DATA_ISSUE = 'dataIssue',
  DATA_TYPE = 'dataType',
  DESCRIPTION = 'description',
  GITHUB_ISSUE_URL = 'githubIssueUrl',
  CREATED_BY_ID = 'createdById',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export async function createDataIssue(
  qx: QueryExecutor,
  data: IDbInsertDataIssuePayload,
): Promise<IDataIssue> {
  const id = generateUUIDv4()
  await qx.result(
    `insert into "dataIssues" ("id", "entity", "profileUrl", "dataIssue", "dataType", "description", "githubIssueUrl", "createdById")
        values ($(id), $(entity), $(profileUrl), $(dataIssue), $(dataType), $(description), $(githubIssueUrl), $(createdById))`,
    {
      id,
      entity: data.entity,
      profileUrl: data.profileUrl,
      dataIssue: data.dataIssue,
      dataType: data.dataType,
      description: data.description,
      githubIssueUrl: data.githubIssueUrl,
      createdById: data.createdById,
    },
  )

  return findDataIssueById(qx, id, Object.values(DataIssueField))
}

export async function findDataIssueById<T extends DataIssueField>(
  qx: QueryExecutor,
  dataIssueId: string,
  fields: T[],
): Promise<QueryResult<T>> {
  return queryTableById(qx, 'dataIssues', Object.values(DataIssueField), dataIssueId, fields)
}
