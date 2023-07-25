export interface IPaginatedResponse<T> {
  elements: T[]
  after?: string
}

export interface IBatchCreateOrganizationsResult {
  organizationId: string
  sourceId: string
}

export interface IBatchCreateMemberResult {
  memberId: string
  sourceId: string
}

export type IBatchOperationResult = IBatchCreateMemberResult[] | IBatchCreateOrganizationsResult[]
