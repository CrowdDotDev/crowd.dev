import { IMemberAttribute, MemberAttributeType } from '@crowd/types'

export interface IQueryNumberOfNewMembers {
  segmentIds?: string[]
  after?: Date
  before?: Date
  platform?: string
}

export interface IQueryTimeseriesOfNewMembers {
  segmentIds?: string[]
  after: Date
  before: Date
  platform?: string
}

export interface IMemberSegmentAggregates {
  memberId: string
  segmentId: string

  activityCount: number
  lastActive: string
  activityTypes: string[]
  activeOn: string[]
  averageSentiment: number
  activeDaysCount: number
}

export interface IMemberActivityCoreAggregates {
  memberId: string
  segmentId: string

  activityCount: number
  activeOn: string[]
}

export interface IMemberActivitySummary {
  activityCount: number
  lastActive: string
}

export interface AttributeData extends IMemberAttribute {
  id: string
  createdAt: string
  updatedAt: string
}

export interface IDbMemberAttributeSetting {
  id: string
  type: MemberAttributeType
  canDelete: boolean
  show: boolean
  label: string
  name: string
  options: unknown
}

export interface IDbMemberTag {
  id: string
}

export interface IDbMemberData {
  id: string
  tags: IDbMemberTag[]
  displayName: string

  activityCount?: number
  lastActive?: string
  activityTypes?: string[]
  activeOn?: string[]
  averageSentiment?: number
  activeDaysCount?: number
}
