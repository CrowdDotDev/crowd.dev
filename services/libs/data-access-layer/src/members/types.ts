export interface IQueryNumberOfNewMembers {
  tenantId: string
  segmentIds?: string[]
  after?: Date
  before?: Date
  platform?: string
}

export interface IQueryTimeseriesOfNewMembers {
  tenantId: string
  segmentIds?: string[]
  after: Date
  before: Date
  platform?: string
}
export interface IMemberSegmentAggregates {
  memberId: string
  segmentId: string
  tenantId: string

  activityCount: number
  lastActive: string
  activityTypes: string[]
  activeOn: string[]
  averageSentiment: number
}

export interface IMemberAbsoluteAggregates {
  activityCount: number
  lastActive: string
}
