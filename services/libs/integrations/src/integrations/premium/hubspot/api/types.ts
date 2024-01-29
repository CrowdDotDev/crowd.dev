import { IMember } from '@crowd/types'

export interface IPaginatedResponse<T> {
  elements: T[]
  after?: string
}

export interface IBatchCreateOrganizationsResult {
  organizationId: string
  sourceId: string
  lastSyncedPayload: unknown
}

export type IBatchUpdateOrganizationsResult = IBatchCreateOrganizationsResult

export interface IBatchCreateMembersResult {
  memberId: string
  sourceId: string
  lastSyncedPayload: unknown
}

export interface IBatchCreateMemberResultWithConflicts {
  members: IBatchCreateMembersResult[]
  conflicts: IMember[]
}

export interface IBatchUpdateMembersResult {
  memberId: string
  sourceId: string
  lastSyncedPayload: unknown
}

export interface IBatchOperationResult {
  created: IBatchCreateMembersResult[] | IBatchCreateOrganizationsResult[]
  updated: IBatchCreateMembersResult[] | IBatchCreateOrganizationsResult[]
}
