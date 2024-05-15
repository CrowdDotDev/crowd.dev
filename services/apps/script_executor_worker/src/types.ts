export interface IFindAndMergeMembersWithSameVerifiedEmailsInDifferentPlatformsArgs {
  tenantId: string
  afterHash?: number
}

export interface IFindAndMergeMembersWithSameIdentitiesDifferentCapitalizationInPlatformArgs {
  tenantId: string
  platform: string
  afterHash?: number
}

export interface IFixActivitiesWithWrongMembersArgs {
  tenantId: string
}
