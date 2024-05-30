export interface ISimilarMember {
  primaryMemberId: string
  secondaryMemberId: string
  primaryMemberIdentityValue: string
  secondaryMemberIdentityValue: string
  hash: number
}

export interface IActivityPartial {
  id: string
  wrongMemberId: string
  correctMemberId: string
}

export interface IFindMemberMergeActionReplacement {
  memberId: string
  startDate?: string
  endDate?: string
  userId?: string
}
