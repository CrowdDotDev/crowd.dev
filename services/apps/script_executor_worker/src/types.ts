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

export interface IPopulateActivityRelationsArgs {
  batchSizePerRun: number
  deleteIndexedEntities?: boolean
  latestSyncedActivityTimestamp?: string
}

export interface IScriptBatchTestArgs {
  batchSize?: number
  testRun?: boolean
}

export interface ISyncArgs extends IScriptBatchTestArgs {
  segmentId?: string
  chunkSize?: number
  clean?: boolean
  withAggs?: boolean
}

export interface ISyncSegmentsArgs extends ISyncArgs {
  segmentIds: string[]
  entityType?: string
}

export interface IFixActivityForiegnKeysArgs extends IScriptBatchTestArgs {
  entityType: string
  offset?: number
}
