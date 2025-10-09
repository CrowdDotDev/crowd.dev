export interface IActivityBySentimentMoodResult {
  sentimentLabel: string
  count: number
}

export interface IActivityByTypeAndPlatformResult {
  type: string
  platform: string
  count: number
}

export interface IQueryTimeseriesParams {
  segmentIds?: string[]
  startDate: Date
  endDate: Date
  platform?: string
}

export interface ITimeseriesDatapoint {
  date: string
  count: number
}

export interface IDashboardWidget {
  total: number
  previousPeriodTotal: number
  timeseries: ITimeseriesDatapoint[]
}

interface ITimePeriod {
  startDate: Date
  endDate: Date
}

export interface ITimeframe {
  current: ITimePeriod
  previous: ITimePeriod
}

export interface IDashboardData {
  activeMembers: IDashboardWidget
  newMembers: IDashboardWidget
  newOrganizations: IDashboardWidget
  activeOrganizations: IDashboardWidget
  activity: IDashboardWidget
}
