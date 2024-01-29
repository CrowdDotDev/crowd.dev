export interface DashboardCubeData {
  activeMembers: {
    total: number,
    previousPeriodTotal: number,
    timeseries: any
  },
  newMembers: {
    total: number,
    previousPeriodTotal: number,
    timeseries: any
  },
  newOrganizations: {
    total: number,
    previousPeriodTotal: number,
    timeseries: any
  },
  activeOrganizations: {
    total: number,
    previousPeriodTotal: number,
    timeseries: any
  },
  activity: {
    total: number,
    previousPeriodTotal: number,
    timeseries: any
    bySentimentMood: any
    byTypeAndPlatform: any
  }
}
