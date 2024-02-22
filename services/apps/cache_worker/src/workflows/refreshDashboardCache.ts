import { proxyActivities } from '@temporalio/workflow'

import { IProcessRefreshDashboardCacheArgs } from '@crowd/types'
import * as activities from '../activities/dashboard-cache/refreshDashboardCache'

import {
  IActiveMembersTimeseriesResult,
  IActiveOrganizationsTimeseriesResult,
  IActivityBySentimentMoodResult,
  IActivityByTypeAndPlatformResult,
  IActivityTimeseriesResult,
  IDashboardData,
  INewMembersTimeseriesResult,
  INewOrganizationsTimeseriesResult,
  ITimeframe,
} from '../types'
import moment from 'moment'
import { DashboardTimeframe } from '../enums'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '3 minute',
  retry: { maximumAttempts: 3 },
})

export async function refreshDashboardCache(
  args: IProcessRefreshDashboardCacheArgs,
): Promise<void> {
  const segmentsEnabled = args.segmentId ? true : false

  // if no segments were sent, set current segment as default one
  if (!args.segmentId) {
    const defaultSegment = await activity.getDefaultSegment(args.tenantId)
    args.segmentId = defaultSegment.segmentId
    args.leafSegmentIds = [defaultSegment.segmentId]
  }

  const dashboardLastRefreshedAt = await activity.getDashboardCacheLastRefreshedAt(args.segmentId)

  const activePlatforms = await activity.getActivePlatforms(args.leafSegmentIds)

  const currentDate = new Date()

  // we should do a full refresh, when
  // - segments are enabled (we only refresh once a day for segment enabled deploys, so no need for same-day optimizations)
  // - dashboard wasn't refreshed before yet (ie: it's null)
  // - day changed between now() and dashboardLastRefreshedAt, so we need to calculate the metrics for the new time range
  if (
    segmentsEnabled ||
    !dashboardLastRefreshedAt ||
    currentDate.getUTCDate() !== new Date(dashboardLastRefreshedAt).getUTCDate()
  ) {
    // main view with no platform filter
    await refreshDashboardCacheForAllTimeranges(args.tenantId, args.segmentId, args.leafSegmentIds)

    // for each platform also cache dashboard values
    for (const platform of activePlatforms) {
      await refreshDashboardCacheForAllTimeranges(
        args.tenantId,
        args.segmentId,
        args.leafSegmentIds,
        platform,
      )
    }
  } else {
    // first check if there's a new activity between dashboardLastRefreshedAt and now()
    const platforms = await activity.findNewActivityPlatforms(
      dashboardLastRefreshedAt,
      args.leafSegmentIds,
    )

    // only refresh the main view and returned platform views if there are new activities
    if (platforms && platforms.length > 0) {
      // refresh the main view
      await refreshDashboardCacheForAllTimeranges(
        args.tenantId,
        args.segmentId,
        args.leafSegmentIds,
      )

      for (const platform of platforms) {
        await refreshDashboardCacheForAllTimeranges(
          args.tenantId,
          args.segmentId,
          args.leafSegmentIds,
          platform,
        )
      }
    }
  }

  // update dashboardLastRefreshedAt
  await activity.updateMemberMergeSuggestionsLastGeneratedAt(args.segmentId)
}

async function refreshDashboardCacheForAllTimeranges(
  tenantId: string,
  segmentId: string,
  leafSegmentIds: string[],
  platform?: string,
) {
  for (const timeframe in DashboardTimeframe) {
    const data = await getDashboardCacheData(
      tenantId,
      leafSegmentIds,
      DashboardTimeframe[timeframe],
      platform,
    )

    // try saving it to cache
    await activity.saveToCache(tenantId, segmentId, DashboardTimeframe[timeframe], data, platform)
  }
}

async function getDashboardCacheData(
  tenantId: string,
  segmentIds: string[],
  timeframe: DashboardTimeframe,
  platform?: string,
): Promise<IDashboardData> {
  // build dateranges
  const { startDate, endDate, previousPeriodStartDate, previousPeriodEndDate } =
    buildTimeframe(timeframe)

  // new members total
  const newMembersTotal = await activity.getNewMembers<number>({
    tenantId,
    segmentIds,
    startDate,
    endDate,
    platform,
  })

  // new members previous period total
  const newMembersPreviousPeriodTotal = await activity.getNewMembers<number>({
    tenantId,
    segmentIds,
    startDate: previousPeriodStartDate,
    endDate: previousPeriodEndDate,
    platform,
  })

  // new members timeseries
  const newMembersTimeseries = await activity.getNewMembers<INewMembersTimeseriesResult[]>({
    tenantId,
    segmentIds,
    startDate,
    endDate,
    granularity: 'day',
    platform,
    rawResult: true,
  })

  // active members total
  const activeMembersTotal = await activity.getActiveMembers<number>({
    tenantId,
    segmentIds,
    startDate,
    endDate,
    platform,
  })

  // active members previous period total
  const activeMembersPreviousPeriodTotal = await activity.getActiveMembers<number>({
    tenantId,
    segmentIds,
    startDate: previousPeriodStartDate,
    endDate: previousPeriodEndDate,
    platform,
  })

  // active members timeseries
  const activeMembersTimeseries = await activity.getActiveMembers<IActiveMembersTimeseriesResult[]>(
    {
      tenantId,
      segmentIds,
      startDate,
      endDate,
      granularity: 'day',
      platform,
      rawResult: true,
    },
  )

  // new organizations total
  const newOrganizationsTotal = await activity.getNewOrganizations<number>({
    tenantId,
    segmentIds,
    startDate,
    endDate,
    platform,
  })

  // new organizations previous period total
  const newOrganizationsPreviousPeriodTotal = await activity.getNewOrganizations<number>({
    tenantId,
    segmentIds,
    startDate: previousPeriodStartDate,
    endDate: previousPeriodEndDate,
    platform,
  })

  // new organizations timeseries
  const newOrganizationsTimeseries = await activity.getNewOrganizations<
    INewOrganizationsTimeseriesResult[]
  >({
    tenantId,
    segmentIds,
    startDate,
    endDate,
    granularity: 'day',
    platform,
    rawResult: true,
  })

  // active organizations total
  const activeOrganizationsTotal = await activity.getActiveOrganizations<number>({
    tenantId,
    segmentIds,
    startDate,
    endDate,
    platform,
  })

  // active organizations previous period total
  const activeOrganizationsPreviousPeriodTotal = await activity.getActiveOrganizations<number>({
    tenantId,
    segmentIds,
    startDate: previousPeriodStartDate,
    endDate: previousPeriodEndDate,
    platform,
  })

  // active organizations timeseries
  const activeOrganizationsTimeseries = await activity.getActiveOrganizations<
    IActiveOrganizationsTimeseriesResult[]
  >({
    tenantId,
    segmentIds,
    startDate,
    endDate,
    granularity: 'day',
    platform,
    rawResult: true,
  })

  // activities total
  const activitiesTotal = await activity.getActivities<number>({
    tenantId,
    segmentIds,
    startDate,
    endDate,
    platform,
  })

  // activities previous period total
  const activitiesPreviousPeriodTotal = await activity.getActivities<number>({
    tenantId,
    segmentIds,
    startDate: previousPeriodStartDate,
    endDate: previousPeriodEndDate,
    platform,
  })

  // activities timeseries
  const activitiesTimeseries = await activity.getActivities<IActivityTimeseriesResult[]>({
    tenantId,
    segmentIds,
    startDate,
    endDate,
    granularity: 'day',
    platform,
    rawResult: true,
  })

  // activities by sentiment mood
  const activitiesBySentimentMood = await activity.getActivities<IActivityBySentimentMoodResult[]>({
    tenantId,
    segmentIds,
    startDate,
    endDate,
    dimensions: ['Activities.sentimentMood'],
    platform,
    rawResult: true,
  })

  // activities by type and platform
  const activitiesByTypeAndPlatform = await activity.getActivities<
    IActivityByTypeAndPlatformResult[]
  >({
    tenantId,
    segmentIds,
    startDate,
    endDate,
    dimensions: ['Activities.platform', 'Activities.type'],
    order: { 'Activities.count': 'desc' },
    platform,
    rawResult: true,
  })

  return {
    newMembers: {
      total: newMembersTotal,
      previousPeriodTotal: newMembersPreviousPeriodTotal,
      timeseries: newMembersTimeseries,
    },
    activeMembers: {
      total: activeMembersTotal,
      previousPeriodTotal: activeMembersPreviousPeriodTotal,
      timeseries: activeMembersTimeseries,
    },
    newOrganizations: {
      total: newOrganizationsTotal,
      previousPeriodTotal: newOrganizationsPreviousPeriodTotal,
      timeseries: newOrganizationsTimeseries,
    },
    activeOrganizations: {
      total: activeOrganizationsTotal,
      previousPeriodTotal: activeOrganizationsPreviousPeriodTotal,
      timeseries: activeOrganizationsTimeseries,
    },
    activity: {
      total: activitiesTotal,
      previousPeriodTotal: activitiesPreviousPeriodTotal,
      timeseries: activitiesTimeseries,
      bySentimentMood: activitiesBySentimentMood,
      byTypeAndPlatform: activitiesByTypeAndPlatform,
    },
  }
}

function buildTimeframe(timeframe: DashboardTimeframe): ITimeframe {
  if (timeframe === DashboardTimeframe.LAST_7_DAYS) {
    const startDate = moment().subtract(6, 'days').startOf('day').toISOString()
    const endDate = moment().endOf('day').toISOString()
    const previousPeriodStartDate = moment().subtract(13, 'days').startOf('day').toISOString()
    const previousPeriodEndDate = moment().subtract(7, 'days').endOf('day').toISOString()

    return {
      startDate,
      endDate,
      previousPeriodStartDate,
      previousPeriodEndDate,
    }
  }

  if (timeframe === DashboardTimeframe.LAST_14_DAYS) {
    const startDate = moment().subtract(13, 'days').startOf('day').toISOString()
    const endDate = moment().endOf('day').toISOString()
    const previousPeriodStartDate = moment().subtract(27, 'days').startOf('day').toISOString()
    const previousPeriodEndDate = moment().subtract(14, 'days').endOf('day').toISOString()

    return {
      startDate,
      endDate,
      previousPeriodStartDate,
      previousPeriodEndDate,
    }
  }

  if (timeframe === DashboardTimeframe.LAST_30_DAYS) {
    const startDate = moment().subtract(29, 'days').startOf('day').toISOString()
    const endDate = moment().endOf('day').toISOString()
    const previousPeriodStartDate = moment().subtract(59, 'days').startOf('day').toISOString()
    const previousPeriodEndDate = moment().subtract(30, 'days').endOf('day').toISOString()

    return {
      startDate,
      endDate,
      previousPeriodStartDate,
      previousPeriodEndDate,
    }
  }

  throw new Error(`Unsupported timerange ${timeframe}!`)
}
