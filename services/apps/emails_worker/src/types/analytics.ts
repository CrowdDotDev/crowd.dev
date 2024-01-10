import { SegmentRawData } from '@crowd/types'

export interface InputAnalytics {
  tenantId: string
  tenantName: string
  segmentIds?: string[]
}

export interface InputAnalyticsWithTimes extends InputAnalytics, AnalyticsWithTimes {}

export interface AnalyticsWithTimes {
  unixEpoch: string
  dateTimeEndThisWeek: string
  dateTimeStartThisWeek: string
  dateTimeEndPreviousWeek: string
  dateTimeStartPreviousWeek: string
}

export interface InputAnalyticsWithSegments extends InputAnalyticsWithTimes {
  segments: SegmentRawData[]
}
