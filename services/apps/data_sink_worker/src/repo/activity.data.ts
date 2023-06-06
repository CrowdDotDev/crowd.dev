import { DbColumnSet, DbInstance } from '@crowd/database'
import { ISentimentAnalysisResult } from '@crowd/sentiment'

export interface IDbActivity {
  id: string
  platform: string
  type: string
  timestamp: string
  isContribution: boolean
  score: number
  sourceId: string
  sourceParentId?: string
  parentId?: string
  memberId: string
  username: string
  attributes: Record<string, unknown>
  body?: string
  title?: string
  channel?: string
  url?: string
  sentiment: ISentimentAnalysisResult
}

export interface IDbActivityCreateData {
  type: string
  timestamp: string
  platform: string
  isContribution: boolean
  score: number
  sourceId: string
  sourceParentId?: string
  parentId?: string
  tenantId: string
  memberId: string
  username: string
  sentiment: ISentimentAnalysisResult
  attributes: Record<string, unknown>
  body?: string
  title?: string
  channel?: string
  url?: string
}

let insertActivityColumnSet: DbColumnSet
export const getInsertActivityColumnSet = (instance: DbInstance): DbColumnSet => {
  if (insertActivityColumnSet) {
    return insertActivityColumnSet
  }

  insertActivityColumnSet = new instance.helpers.ColumnSet(
    [
      'id',
      'type',
      'timestamp',
      'platform',
      'isContribution',
      'score',
      'sourceId',
      'sourceParentId',
      'tenantId',
      'memberId',
      'username',
      'sentiment',
      'attributes',
      'body',
      'title',
      'channel',
      'url',
      'createdAt',
      'updatedAt',
    ],
    {
      table: {
        table: 'activities',
      },
    },
  )

  return insertActivityColumnSet
}

export interface IDbActivityUpdateData {
  type: string
  isContribution: boolean
  score: number
  sourceId: string
  sourceParentId?: string
  memberId: string
  username: string
  sentiment: ISentimentAnalysisResult
  attributes?: Record<string, unknown>
  body?: string
  title?: string
  channel?: string
  url?: string
}

let updateActivityColumnSet: DbColumnSet
export const getUpdateActivityColumnSet = (instance: DbInstance): DbColumnSet => {
  if (updateActivityColumnSet) {
    return updateActivityColumnSet
  }

  updateActivityColumnSet = new instance.helpers.ColumnSet(
    [
      'type',
      'isContribution',
      'score',
      'sourceId',
      'sourceParentId',
      'memberId',
      'username',
      'sentiment',
      'attributes',
      'body',
      'title',
      'channel',
      'url',
      'updatedAt',
    ],
    {
      table: {
        table: 'activities',
      },
    },
  )

  return updateActivityColumnSet
}
