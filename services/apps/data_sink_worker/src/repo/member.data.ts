import { DbColumnSet, DbInstance } from '@crowd/database'
import { IMemberIdentity } from '@crowd/types'

export interface IDbMember {
  id: string
  displayName: string
  emails: string[]
  joinedAt: string
  attributes: Record<string, unknown>
  weakIdentities: IMemberIdentity[]
}

let getMemberColumnSet: DbColumnSet
export function getSelectMemberColumnSet(instance: DbInstance): DbColumnSet {
  if (getMemberColumnSet) return getMemberColumnSet

  getMemberColumnSet = new instance.helpers.ColumnSet(
    ['id', 'emails', 'score', 'joinedAt', 'reach', 'attributes', 'weakIdentities'],
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
}

let updateMemberColumnSet: DbColumnSet
export function getUpdateMemberColumnSet(instance: DbInstance): DbColumnSet {
  if (updateMemberColumnSet) return updateMemberColumnSet

  updateMemberColumnSet = new instance.helpers.ColumnSet(
    ['attributes', 'emails', 'joinedAt', 'weakIdentities', 'updatedAt'],
    {
      table: {
        table: 'members',
      },
    },
  )

  return updateMemberColumnSet
}

let insertMemberIdentityColumnSet: DbColumnSet
export function getInsertMemberIdentityColumnSet(instance: DbInstance): DbColumnSet {
  if (insertMemberIdentityColumnSet) return insertMemberIdentityColumnSet

  insertMemberIdentityColumnSet = new instance.helpers.ColumnSet(
    ['memberId', 'platform', 'username', 'sourceId', 'tenantId', 'integrationId'],
    {
      table: {
        table: 'memberIdentities',
      },
    },
  )

  return insertMemberIdentityColumnSet
}
