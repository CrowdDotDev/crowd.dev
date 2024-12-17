import { generateUUIDv4 } from '@crowd/common'
import { IDataIssue } from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'
import { QueryResult, queryTableById } from '../utils'

export interface IDbInsertDataIssuePayload {
  entity: string
  profileUrl: string
  dataIssue: string
  dataType: string
  description: string
  issueUrl: string
  createdById: string
}

export interface IMarkDataIssueAsResolvedPayload {
  resolutionEmailSentTo: string
}

export enum DataIssueField {
  // meta
  ID = 'id',
  ENTITY = 'entity',
  PROFILE_URL = 'profileUrl',
  DATA_ISSUE = 'dataIssue',
  DATA_TYPE = 'dataType',
  DESCRIPTION = 'description',
  ISSUE_URL = 'issueUrl',
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
    `insert into "dataIssues" ("id", "entity", "profileUrl", "dataIssue", "dataType", "description", "issueUrl", "createdById")
        values ($(id), $(entity), $(profileUrl), $(dataIssue), $(dataType), $(description), $(issueUrl), $(createdById))`,
    {
      id,
      entity: data.entity,
      profileUrl: data.profileUrl,
      dataIssue: data.dataIssue,
      dataType: data.dataType,
      description: data.description,
      issueUrl: data.issueUrl,
      createdById: data.createdById,
    },
  )

  return findDataIssueById(qx, id, Object.values(DataIssueField))
}

export async function markDataIssueAsResolved(
  qx: QueryExecutor,
  dataIssueId: string,
  data: IMarkDataIssueAsResolvedPayload,
): Promise<IDataIssue> {
  const id = generateUUIDv4()
  await qx.result(
    `update "dataIssues" 
     set
        "resolutionEmailSentAt" = now(),
        "resolutionEmailSentTo" = $(resolutionEmailSentTo)
     where "id" = $(dataIssueId)`,
    {
      id,
      resolutionEmailSentTo: data.resolutionEmailSentTo,
      dataIssueId,
    },
  )

  return findDataIssueById(qx, id, Object.values(DataIssueField))
}

export async function findDataIssueByUrl(qx: QueryExecutor, issueUrl: string): Promise<IDataIssue> {
  const response = await qx.select(`select * from "dataIssues" where "issueUrl" = $(issueUrl)`, {
    issueUrl,
  })
  if (response.length > 0) {
    return response[0]
  }
  return null
}

export async function findDataIssueById<T extends DataIssueField>(
  qx: QueryExecutor,
  dataIssueId: string,
  fields: T[],
): Promise<QueryResult<T>> {
  return queryTableById(qx, 'dataIssues', Object.values(DataIssueField), dataIssueId, fields)
}
