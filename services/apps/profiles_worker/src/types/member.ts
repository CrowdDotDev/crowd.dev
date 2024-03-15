export interface MemberWithIDOnly {
  member: {
    id: string
  }
}

export interface IRecalculateAffiliationsForNewRolesInput {
  offset?: number
  tenant: {
    id: string
  }
}
