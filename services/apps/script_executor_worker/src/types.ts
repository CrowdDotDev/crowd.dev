export interface IFindAndMergeMembersWithSameVerifiedEmailsInDifferentPlatformsArgs {
  afterHash?: number
}

export interface IFindAndMergeMembersWithSameIdentitiesDifferentCapitalizationInPlatformArgs {
  platform: string
  afterHash?: number
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
  testRun?: boolean
}
