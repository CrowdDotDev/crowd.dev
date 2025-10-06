import { proxyActivities } from '@temporalio/workflow'
import moment from 'moment'

import {
  IDashboardData,
  IDashboardWidget,
  IProcessRefreshDashboardCacheArgs,
  IQueryTimeseriesParams,
  ITimeframe,
  ITimeseriesDatapoint,
} from '@crowd/types'

import * as activities from '../activities/dashboard-cache/refreshDashboardCache'
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
    const defaultSegment = await activity.getDefaultSegment()
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
    await refreshDashboardCacheForAllTimeranges(args.segmentId, args.leafSegmentIds)

    // for each platform also cache dashboard values
    for (const platform of activePlatforms) {
      await refreshDashboardCacheForAllTimeranges(args.segmentId, args.leafSegmentIds, platform)
    }
  }
  // update dashboardLastRefreshedAt
  await activity.updateMemberMergeSuggestionsLastGeneratedAt(args.segmentId)
}

async function refreshDashboardCacheForAllTimeranges(
  segmentId: string,
  leafSegmentIds: string[],
  platform?: string,
) {
  for (const timeframe in DashboardTimeframe) {
    const data = await getDashboardCacheData(
      leafSegmentIds,
      DashboardTimeframe[timeframe],
      platform,
    )

    // try saving it to cache
    await activity.saveToCache(segmentId, DashboardTimeframe[timeframe], data, platform)
  }
}

function generateDateRange(startDate: Date, endDate: Date): string[] {
  const dates: string[] = []
  const currentDate = moment(startDate)
  const end = moment(endDate)

  while (currentDate.isSameOrBefore(end)) {
    dates.push(currentDate.format('YYYY-MM-DD'))
    currentDate.add(1, 'day')
  }

  return dates
}

function convertFullTimeseriesToWidget(
  rows: ITimeseriesDatapoint[],
  timeframe: ITimeframe,
): IDashboardWidget {
  const currentPeriodDates = generateDateRange(
    timeframe.current.startDate,
    timeframe.current.endDate,
  )
  const previousPeriodDates = generateDateRange(
    timeframe.previous.startDate,
    timeframe.previous.endDate,
  )

  const currentPeriodMap = new Map(
    rows.map((row) => [moment(row.date).format('YYYY-MM-DD'), Number(row.count)]),
  )
  const previousPeriodMap = new Map(
    rows.map((row) => [moment(row.date).format('YYYY-MM-DD'), Number(row.count)]),
  )

  const currentPeriodRows = currentPeriodDates.map((date) => ({
    date,
    count: currentPeriodMap.get(date) || 0,
  }))

  const previousPeriodRows = previousPeriodDates.map((date) => ({
    date,
    count: previousPeriodMap.get(date) || 0,
  }))

  const total = currentPeriodRows.reduce((sum, row) => sum + row.count, 0)
  const previousPeriodTotal = previousPeriodRows.reduce((sum, row) => sum + row.count, 0)

  return {
    total,
    previousPeriodTotal,
    timeseries: currentPeriodRows,
  }
}

async function getDashboardCacheData(
  segmentIds: string[],
  dashboardTimeframe: DashboardTimeframe,
  platform?: string,
): Promise<IDashboardData> {
  // build dateranges
  const timeframe = buildTimeframe(dashboardTimeframe)

  const params: IQueryTimeseriesParams = {
    segmentIds,
    startDate: timeframe.previous.startDate, // it's intended to use previous period start date here ...
    endDate: timeframe.current.endDate, // ... and current period end date here
    platform,
  }

  const newMembers = convertFullTimeseriesToWidget(
    await activity.getNewMembersTimeseries(params),
    timeframe,
  )
  const activeMembers = convertFullTimeseriesToWidget(
    await activity.getActiveMembersTimeseries(params),
    timeframe,
  )
  const newOrganizations = convertFullTimeseriesToWidget(
    await activity.getNewOrganizationsTimeseries(params),
    timeframe,
  )
  const activeOrganizations = convertFullTimeseriesToWidget(
    await activity.getActiveOrganizationsTimeseries(params),
    timeframe,
  )

  // activities total
  const activitiesTotal = await activity.getActivitiesNumber({
    segmentIds,
    ...timeframe.current,
    platform,
  })

  // activities previous period total
  const activitiesPreviousPeriodTotal = await activity.getActivitiesNumber({
    segmentIds,
    ...timeframe.previous,
    platform,
  })

  // activities timeseries
  const activitiesTimeseries = await activity.getActivitiesTimeseries({
    segmentIds,
    ...timeframe.previous,
    platform,
  })

  return {
    newMembers,
    activeMembers,
    newOrganizations,
    activeOrganizations,
    activity: {
      total: activitiesTotal,
      previousPeriodTotal: activitiesPreviousPeriodTotal,
      timeseries: activitiesTimeseries,
    },
  }
}

function buildTimeframe(timeframe: DashboardTimeframe): ITimeframe {
  const numDays = {
    [DashboardTimeframe.LAST_7_DAYS]: 7,
    [DashboardTimeframe.LAST_14_DAYS]: 14,
    [DashboardTimeframe.LAST_30_DAYS]: 30,
  }[timeframe]

  if (!numDays) {
    throw new Error(`Unsupported timerange ${timeframe}!`)
  }

  const startDate = moment()
    .subtract(numDays - 1, 'days')
    .startOf('day')
    .toDate()
  const endDate = moment().add(1, 'days').startOf('day').toDate()
  const previousPeriodStartDate = moment()
    .subtract(numDays * 2 - 1, 'days')
    .startOf('day')
    .toDate()
  const previousPeriodEndDate = moment()
    .subtract(numDays - 1, 'days')
    .startOf('day')
    .toDate()

  return {
    current: {
      startDate,
      endDate,
    },
    previous: {
      startDate: previousPeriodStartDate,
      endDate: previousPeriodEndDate,
    },
  }
}
