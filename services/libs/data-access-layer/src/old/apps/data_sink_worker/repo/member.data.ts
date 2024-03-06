import { DbColumnSet, DbInstance } from '@crowd/database'
import { IMemberIdentity, PlatformType } from '@crowd/types'

export interface IDbMember {
  id: string
  displayName: string
  emails: string[]
  joinedAt: string
  attributes: Record<string, unknown>
  weakIdentities: IMemberIdentity[]
  tenantId: string
  reach: Partial<Record<PlatformType | 'total', number>>
}

let getMemberColumnSet: DbColumnSet
export function getSelectMemberColumnSet(instance: DbInstance): DbColumnSet {
  if (getMemberColumnSet) return getMemberColumnSet

  getMemberColumnSet = new instance.helpers.ColumnSet(
    [
      'id',
      'emails',
      'score',
      'joinedAt',
      'reach',
      'attributes',
      'weakIdentities',
      'displayName',
      'tenantId',
    ],
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
  emails: string[]
  joinedAt: string
  attributes: Record<string, unknown>
  weakIdentities: IMemberIdentity[]
  identities: IMemberIdentity[]
  reach: Partial<Record<PlatformType, number>>
}

let insertMemberColumnSet: DbColumnSet
export function getInsertMemberColumnSet(instance: DbInstance): DbColumnSet {
  if (insertMemberColumnSet) return insertMemberColumnSet

  insertMemberColumnSet = new instance.helpers.ColumnSet(
    [
      'id',
      'attributes',
      'displayName',
      'emails',
      'joinedAt',
      'tenantId',
      'weakIdentities',
      'reach',
      'createdAt',
      'updatedAt',
    ],
    {
      table: {
        table: 'members',
      },
    },
  )

  return insertMemberColumnSet
}

export interface IDbMemberUpdateData {
  emails: string[]
  joinedAt: string
  attributes: Record<string, unknown>
  weakIdentities: IMemberIdentity[]
  identities: IMemberIdentity[]
  displayName: string
  reach: Partial<Record<PlatformType, number>>
}

let insertMemberIdentityColumnSet: DbColumnSet
export function getInsertMemberIdentityColumnSet(instance: DbInstance): DbColumnSet {
  if (insertMemberIdentityColumnSet) return insertMemberIdentityColumnSet

  insertMemberIdentityColumnSet = new instance.helpers.ColumnSet(
    ['memberId', 'platform', 'value', 'type', 'sourceId', 'tenantId', 'integrationId'],
    {
      table: {
        table: 'memberIdentities',
      },
    },
  )

  return insertMemberIdentityColumnSet
}

export interface IDbMemberSegment {
  memberId: string
  tenantId: string
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
