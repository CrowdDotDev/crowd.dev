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

export enum MemberRoleUnmergeStrategy {
  SAME_MEMBER = 'same-member',
  SAME_ORGANIZATION = 'same-organization',
}
