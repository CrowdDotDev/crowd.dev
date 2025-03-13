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

export interface ICopyActivitiesFromQuestDbToTinybirdArgs {
  deleteIndexedEntities?: boolean
  batchSizePerRun?: number
  latestSyncedActivityTimestamp?: string
  segmentIds?: string[]
}

export interface IFixOrgIdentitiesWithWrongUrlsArgs {
  testRun?: boolean
}

export interface IPopulateActivityRelationsArgs {
  batchSizePerRun: number
  deleteIndexedEntities?: boolean
  latestSyncedActivityTimestamp?: string
}
export interface ISyncArgs {
  batchSize?: number
  chunkSize?: number
  clean?: boolean
  withAggs?: boolean
  testRun?: boolean
}

export interface IUnlinkDeletedMemberOrgArgs {
  memberId: string
}
