import {
  IActivityBySentimentMoodResult,
  IActivityByTypeAndPlatformResult,
  IActivityTimeseriesResult,
} from '@crowd/data-access-layer'
import { IActiveOrganizationsTimeseriesResult } from '@crowd/data-access-layer/src/organizations'

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

export interface IGraphQueryParams {
  tenantId: string
  segmentIds: string[]
  startDate: Date
  endDate: Date
  platform?: string
  groupBy?: string
}

export interface IProcessComputeOrgAggs {
  organizationId: string
}
