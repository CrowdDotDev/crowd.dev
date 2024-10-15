/* eslint-disable @typescript-eslint/no-explicit-any */

import { SegmentRawData } from '@crowd/types'
import { IDbMember } from '../old/apps/data_sink_worker/repo/member.data'

export interface IQueryActivityResult {
  id: string
  attributes: unknown
  body?: string | null
  channel?: string | null
  conversationId?: string | null
  createdAt?: string
  createdById?: string
  isContribution: boolean
  memberId: string
  username: string
  objectMemberId?: string | null
  objectMemberUsername?: string | null
  organizationId?: string | null
  parentId?: string | null
  platform: string
  score: number
  segmentId: string
  sentiment?: IActivitySentiment | null
  sourceId: string
  sourceParentId?: string | null
  tenantId: string
  timestamp: string
  title?: string | null
  type: string
  updatedAt?: string
  updatedById?: string
  url?: string | null
  relations?: {
    member?: IDbMember
  }

  // TODO questdb: Needed?
  ids?: string[]
  count?: number
}

export interface IActivitySentiment {
  label: string
  sentiment: number
  mixed: number
  neutral: number
  positive: number
  negative: number
}

export interface IQueryActivitiesParameters {
  tenantId?: string
  segmentIds?: string[]
  filter?: any
  orderBy?: string[]
  limit?: number
  noLimit?: boolean
  offset?: number
  countOnly?: boolean
  groupBy?: string
}

export interface IQueryGroupedActivitiesParameters {
  tenantId: string
  segmentIds?: string[]
  after?: Date
  before?: Date
  platform?: string
}

export interface IQueryTopActivitiesParameters {
  tenantId: string
  segments?: SegmentRawData[]
  after: Date
  before: Date
  limit: number
}

export interface INumberOfActivitiesPerMember {
  memberId: string
  count: number
}

export interface INumberOfActivitiesPerOrganization {
  organizationId: string
  count: number
}

export interface IQueryDistinctParameters {
  tenantId: string
  segmentIds?: string[]
  after: Date
  before: Date
  platform?: string
  limit?: number
}

export interface ActivityType {
  count: number
  type: string
  platform: string
  percentage: string
  platformIcon: string
}

export interface IMemberSegment {
  memberId: string
  segmentId: string
}

export interface IOrganizationSegment {
  organizationId: string
  segmentId: string
}

export interface IActiveMemberData {
  memberId: string
  activityCount: number
  activeDaysCount: number
}

export interface IQueryNumberOfActiveMembersParameters {
  tenantId: string
  segmentIds?: string[]
  organizationId?: string
  timestampFrom?: Date
  timestampTo?: Date
  platform?: string
  groupBy?: undefined | 'day'
}

export interface IQueryActiveMembersParameters {
  tenantId: string
  segmentIds: string[]
  timestampFrom: string
  timestampTo: string
  platforms?: string[]
  isContribution?: boolean
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

export interface IQueryActiveOrganizationsParameters {
  tenantId: string
  segmentIds: string[]
  timestampFrom: Date
  timestampTo: Date
  platforms?: string[]
  orderBy: 'activityCount' | 'activeDaysCount'
  orderByDirection: 'asc' | 'desc'
  limit: number
  offset: number
}

export interface IQueryNumberOfActiveOrganizationsParameters {
  tenantId: string
  segmentIds?: string[]
  timestampFrom?: Date
  timestampTo?: Date
  platform?: string
  groupBy?: undefined | 'day'
}

export interface IActivityTimeseriesResult {
  date: string
  count: number
}

export interface IActivityBySentimentMoodResult {
  sentimentLabel: string
  count: number
}

export interface IActivityByTypeAndPlatformResult {
  type: string
  platform: string
  count: number
}

export interface INewActivityPlatforms {
  segmentIds: string[]
  after: Date
}
