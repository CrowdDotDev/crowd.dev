export interface ISimilarMember {
  primaryMemberId: string
  secondaryMemberId: string
  primaryMemberIdentityValue: string
  secondaryMemberIdentityValue: string
  hash: number
}

export interface IFindMemberMergeActionReplacement {
  memberId: string
  startDate?: string
  endDate?: string
  userId?: string
  limit?: number
}
export interface IFindMemberIdentitiesGroupedByPlatformResult {
  platforms: string[]
  types: string[]
  verified: boolean[]
  tenantId: string
  values: string[]
  groupedByValue: string
}

export interface IFindActivitiesWithWrongMembersResult {
  memberId: string
  username: string
  platform: string
}
