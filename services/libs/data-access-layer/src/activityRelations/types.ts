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
  pullRequestReviewState: string
}

export type IActivityRelationColumn = keyof IDbActivityRelation

export type IActivityRelationsUpdate = Omit<IDbActivityRelation, 'activityId' | 'createdAt'>

export interface IQueryActivityRelationsParameters {
  segmentIds?: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter?: any
  orderBy?: string[]
  limit?: number
  offset?: number
  countOnly?: boolean
  noCount?: boolean
  groupBy?: string
  noLimit?: boolean
}

export interface IQueryActiveMembersParameters {
  segmentIds: string[]
  timestampFrom: string
  timestampTo: string
  platforms?: string[]
  orderBy: 'activityCount' | 'activeDaysCount'
  orderByDirection: 'asc' | 'desc'
  limit: number
  offset: number
}

export interface IActiveMemberData {
  memberId: string
  activityCount: number
  activeDaysCount: number
}

export interface IQueryActiveOrganizationsParameters {
  segmentIds: string[]
  timestampFrom: Date
  timestampTo: Date
  platforms?: string[]
  orderBy: 'activityCount' | 'activeDaysCount'
  orderByDirection: 'asc' | 'desc'
  limit: number
  offset: number
}

export interface IActiveOrganizationData {
  organizationId: string
  activityCount: number
  activeDaysCount: number
}
