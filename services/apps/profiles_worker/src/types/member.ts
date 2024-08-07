export interface MemberUpdateInput {
  memberId: string
  memberOrganizationIds?: string[]
  syncToOpensearch?: boolean
}

export interface IRecalculateAffiliationsForNewRolesInput {
  offset?: number
  tenant: {
    id: string
  }
}
