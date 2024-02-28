import { CubeDimension, CubeGranularity, CubeMeasure, ICubeOrder } from '@crowd/cubejs'

export interface IActiveMembersTimeseriesResult {
  [CubeDimension.ACTIVITY_DATE_DAY]: string
  [CubeDimension.ACTIVITY_DATE]: string
  [CubeMeasure.MEMBER_COUNT]: string
}

export interface INewMembersTimeseriesResult {
  [CubeDimension.MEMBER_JOINED_AT_DAY]: string
  [CubeDimension.MEMBER_JOINED_AT]: string
  [CubeMeasure.MEMBER_COUNT]: string
}

export interface INewOrganizationsTimeseriesResult {
  [CubeDimension.ORGANIZATIONS_JOINED_AT_DAY]: string
  [CubeDimension.ORGANIZATIONS_JOINED_AT]: string
  [CubeMeasure.ORGANIZATION_COUNT]: string
}

export interface IActiveOrganizationsTimeseriesResult {
  [CubeDimension.ACTIVITY_DATE_DAY]: string
  [CubeDimension.ACTIVITY_DATE]: string
  [CubeMeasure.ORGANIZATION_COUNT]: string
}

export interface IActivityTimeseriesResult {
  [CubeDimension.ACTIVITY_DATE_DAY]: string
  [CubeDimension.ACTIVITY_DATE]: string
  [CubeMeasure.ACTIVITY_COUNT]: string
}

export interface IActivityBySentimentMoodResult {
  [CubeDimension.ACTIVITY_SENTIMENT_MOOD]: string
}

export interface IActivityByTypeAndPlatformResult {
  [CubeDimension.ACTIVITY_TYPE]: string
  [CubeDimension.ACTIVITY_PLATFORM]: string
  [CubeMeasure.ACTIVITY_COUNT]: string
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
  startDate: string
  endDate: string
  previousPeriodStartDate: string
  previousPeriodEndDate: string
}

export interface ICubeQueryParams {
  tenantId: string
  segmentIds: string[]
  startDate: string
  endDate: string
  granularity?: CubeGranularity | string
  platform?: string
  rawResult?: boolean
  dimensions?: CubeDimension[] | string[]
  order?: ICubeOrder
}
