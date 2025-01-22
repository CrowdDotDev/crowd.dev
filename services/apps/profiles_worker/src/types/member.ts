export interface MemberUpdateInput {
  member: {
    id: string
  }
  memberOrganizationIds?: string[]
  syncToOpensearch?: boolean
}

export interface IRecalculateAffiliationsForNewRolesInput {
  offset?: number
}
