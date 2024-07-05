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
