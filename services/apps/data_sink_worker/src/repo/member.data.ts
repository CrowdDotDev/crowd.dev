import { DbColumnSet, DbInstance } from '@crowd/database'
import { IMemberIdentity } from '@crowd/types'

export interface IDbMember {
  id: string
  emails: string[]
  score: number
  joinedAt: string
  reach: Record<string, number>
  attributes: Record<string, unknown>
  weakIdentities: IMemberIdentity[]
}

export interface IDbMemberCreateData {
  emails: string[]
  joinedAt: string
  attributes: Record<string, unknown>
  weakIdentities?: IMemberIdentity[]
}

export interface IDbMemberUpdateData {
  emails: string[]
  joinedAt: string
  attributes: Record<string, unknown>
  weakIdentities?: IMemberIdentity[]
}

// column sets
let getMemberColumnSet: DbColumnSet
export const getMemberColumns = (instance: DbInstance): DbColumnSet => {
  if (getMemberColumnSet) {
    return getMemberColumnSet
  }

  getMemberColumnSet = new instance.helpers.ColumnSet(
    ['id', 'emails', 'score', 'joinedAt', 'reach', 'attributes', 'displayName', 'weakIdentities'],
    {
      table: {
        table: 'members',
      },
    },
  )
  return getMemberColumnSet
}
