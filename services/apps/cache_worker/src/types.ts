import { CubeDimension, CubeGranularity, CubeMeasure, ICubeOrder } from '@crowd/cubejs'

export interface IActiveMembersTimeseriesResult {
  date: string
  count: number
}

export interface INewMembersTimeseriesResult {
  date: string
  count: number
}

export interface INewOrganizationsTimeseriesResult {
  date: string
  count: number
}

export interface IActiveOrganizationsTimeseriesResult {
  date: string
  count: number
}

export interface IActivityTimeseriesResult {
  date: string
  count: number
}

export interface IActivityBySentimentMoodResult {
  sentiment: string
}

export interface IActivityByTypeAndPlatformResult {
  type: string
  platform: string
  count: number
}

export interface IDashboardData {
  activeMembers: {
    total: number
    previousPeriodTotal: number
    timeseries: IActiveMembersTimeseriesResult[]
  }
  newMembers: {
    total: number
    previousPeriodTotal: number
    timeseries: INewMembersTimeseriesResult[]
  }
  newOrganizations: {
    total: number
    previousPeriodTotal: number
    timeseries: INewOrganizationsTimeseriesResult[]
  }
  activeOrganizations: {
    total: number
    previousPeriodTotal: number
    timeseries: IActiveOrganizationsTimeseriesResult[]
  }
  activity: {
    total: number
    previousPeriodTotal: number
    timeseries: IActivityTimeseriesResult[]
    bySentimentMood: IActivityBySentimentMoodResult[]
    byTypeAndPlatform: IActivityByTypeAndPlatformResult[]
  }
}

export interface ITimeframe {
  startDate: Date
  endDate: Date
  previousPeriodStartDate: Date
  previousPeriodEndDate: Date
}

export interface ICubeQueryParams {
  tenantId: string
  segmentIds: string[]
  startDate: Date
  endDate: Date
  granularity?: CubeGranularity | string
  platform?: string
  dimensions?: CubeDimension[] | string[]
  order?: ICubeOrder
}
