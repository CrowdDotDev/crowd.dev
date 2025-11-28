import { DbColumnSet, DbInstance } from '@crowd/database'
import { IMemberContribution, IMemberIdentity, PlatformType } from '@crowd/types'

export interface IDbMember {
  id: string
  displayName: string
  joinedAt: string
  attributes: Record<string, unknown>
  reach: Partial<Record<PlatformType | 'total', number>>
  manuallyChangedFields?: string[]
}

let getMemberColumnSet: DbColumnSet
export function getSelectMemberColumnSet(instance: DbInstance): DbColumnSet {
  if (getMemberColumnSet) return getMemberColumnSet

  getMemberColumnSet = new instance.helpers.ColumnSet(
    ['id', 'score', 'joinedAt', 'reach', 'attributes', 'displayName', 'manuallyChangedFields'],
    {
      table: {
        table: 'members',
      },
    },
  )

  return getMemberColumnSet
}

export interface IDbMemberCreateData {
  displayName: string
  joinedAt: string
  attributes: Record<string, unknown>
  identities: IMemberIdentity[]
  reach: Partial<Record<PlatformType, number>>
}

let insertMemberColumnSet: DbColumnSet
export function getInsertMemberColumnSet(instance: DbInstance): DbColumnSet {
  if (insertMemberColumnSet) return insertMemberColumnSet

  insertMemberColumnSet = new instance.helpers.ColumnSet(
    ['id', 'attributes', 'displayName', 'joinedAt', 'tenantId', 'reach', 'createdAt', 'updatedAt'],
    {
      table: {
        table: 'members',
      },
    },
  )

  return insertMemberColumnSet
}

export interface IDbMemberUpdateData {
  joinedAt: string
  attributes: Record<string, unknown>
  identitiesToCreate: IMemberIdentity[]
  identitiesToUpdate: IMemberIdentity[]
  displayName: string
  reach: Partial<Record<PlatformType, number>>
  updatedById?: string
  manuallyChangedFields?: string[]
  contributions?: IMemberContribution[]
}

export interface IDbMemberSegment {
  memberId: string
  segmentId: string
}
