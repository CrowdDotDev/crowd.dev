import { SegmentRawData } from '@crowd/types'

import { IQueryActivityResult } from '../activities'

export interface IQueryConversationsWithActivitiesParameters {
  segments: SegmentRawData[]
  after?: Date
  before?: Date
  limit?: number
}

interface IDbConversation {
  id: string
  title: string
  slug: string
  published: string
  timestamp: string
  createdAt: string
  updatedAt: string
  deletedAt: string
  segmentId: string
  createdById?: string
  updatedById?: string
}

export interface IConversationWithActivities extends IDbConversation {
  platform: string
  platformIcon?: string
  body?: string
  description?: string
  sourceLink?: string
  member?: string
  replyCount?: number
  memberCount?: number

  activities: IQueryActivityResult[]
}

export interface IQueryConversationsParameters {
  segmentIds: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter?: any
  orderBy?: string[]
  limit?: number
  offset?: number
  countOnly?: boolean
}

export interface IQueryConversationResult {
  id: string
  channel: string
  createdAt: string
  memberCount: number
  activityCount: number
  lastActive: string
  platform: string
  title: string
  slug: string
  published: boolean
  segmentId: string
  updatedAt: string
}
