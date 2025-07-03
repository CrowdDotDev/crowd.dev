export interface IDbActivityRelation {
  activityId: string
  memberId: string
  objectMemberId: string | null
  organizationId: string | null
  conversationId: string | null
  parentId: string | null
  segmentId: string
  platform: string
  username: string
  objectMemberUsername: string | null
  createdAt: string
  updatedAt: string
  sourceId: string
  sourceParentId: string
  type: string
  timestamp: string
  channel: string
  sentimentScore: number
  gitInsertions: number
  gitDeletions: number
  score: number
  isContribution: boolean
  pullRequestReviewState: string
}

export type IActivityRelationColumn = keyof IDbActivityRelation

export type IActivityRelationsUpdate = Omit<IDbActivityRelation, 'activityId' | 'createdAt'>
