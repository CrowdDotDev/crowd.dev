export interface IFindAndMergeMembersWithSameVerifiedEmailsInDifferentPlatformsArgs {
  tenantId: string
  afterHash?: number
}

export interface IFindAndMergeMembersWithSameIdentitiesDifferentCapitalizationInPlatformArgs {
  tenantId: string
  platform: string
  afterHash?: number
}

export interface IUnmergeWronglyMergedEmailIdentitiesArgs {
  tenantId: string
}

export interface IDissectMemberArgs {
  memberId: string
  userId?: string
  startDate?: string
  endDate?: string
  undoActionPerWorkflow?: number
  forceSplitAllIdentities?: boolean
}

export interface IFixOrgIdentitiesWithWrongUrlsArgs {
  tenantId: string
  testRun?: boolean
}

export interface IFixMemberAffiliationsArgs {
  tenantId: string
  offset?: number
  testRun?: boolean
}
