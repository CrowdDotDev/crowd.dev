import moment from 'moment'

import { SegmentRawData } from '@crowd/types'

export interface InputAnalytics {
  tenantId: string
  tenantName: string
  segmentIds?: string[]
}

export interface InputAnalyticsWithTimes extends InputAnalytics, AnalyticsWithTimes {}

export interface AnalyticsWithTimes {
  unixEpoch: moment.Moment
  dateTimeEndThisWeek: moment.Moment
  dateTimeStartThisWeek: moment.Moment
  dateTimeEndPreviousWeek: moment.Moment
  dateTimeStartPreviousWeek: moment.Moment
}

export interface InputAnalyticsWithSegments extends InputAnalyticsWithTimes {
  segments: SegmentRawData[]
}
