export enum MergeActionType {
  ORG = 'org',
  MEMBER = 'member',
}

export enum MergeActionState {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  MERGED = 'merged',
  UNMERGED = 'unmerged',
  FINISHING = 'finishing',
  ERROR = 'error',
}

export enum MergeActionStep {
  MERGE_STARTED = 'merge-started',
  MERGE_SYNC_DONE = 'merge-sync-done',
  MERGE_ASYNC_STARTED = 'merge-async-started',
  MERGE_DONE = 'merge-done',

  UNMERGE_STARTED = 'unmerge-started',
  UNMERGE_SYNC_DONE = 'unmerge-sync-done',
  UNMERGE_ASYNC_STARTED = 'unmerge-async-started',
  UNMERGE_DONE = 'unmerge-done',
}

export enum MemberRoleUnmergeStrategy {
  SAME_MEMBER = 'same-member',
  SAME_ORGANIZATION = 'same-organization',
}

export enum LLMSuggestionVerdictType {
  MEMBER = 'member',
  ORGANIZATION = 'organization',
}
