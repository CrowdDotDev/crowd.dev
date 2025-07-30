import { IActivityRelationDuplicateGroup } from '@crowd/data-access-layer'

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
  segmentIds?: string[]
}

export interface IScriptBatchTestArgs {
  batchSize?: number
  testRun?: boolean
}

export interface ISyncArgs extends IScriptBatchTestArgs {
  segmentIds?: string[]
  chunkSize?: number
  clean?: boolean
  withAggs?: boolean
}

export interface IFixActivityForiegnKeysArgs extends IScriptBatchTestArgs {
  entityType: string
  offset?: number
}

export interface IProcessLLMVerifiedMergesArgs extends IScriptBatchTestArgs {
  type: string
}

export interface ICleanupDuplicateMembersArgs extends IScriptBatchTestArgs {
  cutoffDate?: string
  checkByActivityIdentity?: boolean
  checkByTwitterIdentity?: boolean
}

export interface IDedupActivityRelationsArgs extends IScriptBatchTestArgs {
  groupsPerRun?: number
  cursor?: Omit<IActivityRelationDuplicateGroup, 'activityIds'>
}

export interface IRetriggerWorkflowsArgs extends IScriptBatchTestArgs {
  entityType: string
  action: string
}
