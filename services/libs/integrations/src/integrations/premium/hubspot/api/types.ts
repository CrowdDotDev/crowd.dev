export interface IPaginatedResponse<T> {
  elements: T[]
  after?: string
}

export interface IBatchCreateOrganizationsResult {
  organizationId: string
  sourceId: string
  lastSyncedPayload: any
}

export type IBatchUpdateOrganizationsResult = IBatchCreateOrganizationsResult

export interface IBatchCreateMembersResult {
  memberId: string
  sourceId: string
  lastSyncedPayload: any
}

export type IBatchUpdateMembersResult = IBatchCreateMembersResult

export interface IBatchOperationResult {
  created: IBatchCreateMembersResult[] | IBatchCreateOrganizationsResult[]
  updated: IBatchCreateMembersResult[] | IBatchCreateOrganizationsResult[]
}
