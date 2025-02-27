import { DbColumnSet, DbInstance } from '@crowd/database'
import { IMemberIdentity, PlatformType } from '@crowd/types'

export interface IDbMember {
  id: string
  displayName: string
  joinedAt: string
  attributes: Record<string, unknown>
  reach: Partial<Record<PlatformType | 'total', number>>
}

let getMemberColumnSet: DbColumnSet
export function getSelectMemberColumnSet(instance: DbInstance): DbColumnSet {
  if (getMemberColumnSet) return getMemberColumnSet

  getMemberColumnSet = new instance.helpers.ColumnSet(
    ['id', 'score', 'joinedAt', 'reach', 'attributes', 'displayName'],
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
}

export interface IDbMemberSegment {
  memberId: string
  segmentId: string
}

let insertMemberSegmentColumnSet: DbColumnSet
export function getInsertMemberSegmentColumnSet(instance: DbInstance): DbColumnSet {
  if (insertMemberSegmentColumnSet) return insertMemberSegmentColumnSet

  insertMemberSegmentColumnSet = new instance.helpers.ColumnSet(
    ['memberId', 'tenantId', 'segmentId'],
    {
      table: {
        table: 'memberSegments',
      },
    },
  )

  return insertMemberSegmentColumnSet
}
