import { svc } from '../../main'
import {
  IGraphQueryParams,
  IDashboardData,
  INewMembersTimeseriesResult,
  INewOrganizationsTimeseriesResult,
} from '../../types'
import { ISegment } from '@crowd/data-access-layer/src/old/apps/cache_worker/types'
import SegmentRepository from '@crowd/data-access-layer/src/old/apps/cache_worker/segment.repo'
import { RedisCache } from '@crowd/redis'
import { DashboardTimeframe } from '@crowd/types'
import IntegrationRepository from '@crowd/data-access-layer/src/old/apps/cache_worker/integration.repo'
import ActivityRepository from '@crowd/data-access-layer/src/old/apps/cache_worker/activity.repo'
import {
  IActiveMembersTimeseriesResult,
  IActivityBySentimentMoodResult,
  IActivityByTypeAndPlatformResult,
  IActivityTimeseriesResult,
  activitiesBySentiment,
  activitiesByTypeAndPlatform,
  activitiesTimeseries,
  countMembersWithActivities,
  countOrganizationsWithActivities,
  getNumberOfNewMembers,
  getTimeseriesOfActiveMembers,
  queryActivities,
} from '@crowd/data-access-layer'
import { DbStore } from '@crowd/data-access-layer/src/database'
import {
  getNumberOfActiveOrganizations,
  getNumberOfNewOrganizations,
  getTimeseriesOfActiveOrganizations,
  IActiveOrganizationsTimeseriesResult,
} from '@crowd/data-access-layer/src/organizations'

const qdb = new DbStore(svc.log, svc.questdbSQL)

export async function getDashboardCacheLastRefreshedAt(segmentId: string): Promise<string> {
  const segmentRepo = new SegmentRepository(svc.postgres.writer.connection(), svc.log)
  return segmentRepo.getDashboardCacheLastRefreshedAt(segmentId)
}

export async function getDefaultSegment(tenantId: string): Promise<ISegment> {
  const segmentRepo = new SegmentRepository(svc.postgres.writer.connection(), svc.log)
  return segmentRepo.getDefaultSegment(tenantId)
}

export async function getActivePlatforms(leafSegmentIds: string[]): Promise<string[]> {
  const integrationRepo = new IntegrationRepository(svc.postgres.writer.connection(), svc.log)
  return integrationRepo.findActivePlatforms(leafSegmentIds)
}

export async function findNewActivityPlatforms(
  dashboardLastRefreshedAt: string,
  leafSegmentIds: string[],
): Promise<string[]> {
  const activityRepo = new ActivityRepository(svc.postgres.writer.connection(), svc.log)
  return activityRepo.findNewActivityPlatforms(dashboardLastRefreshedAt, leafSegmentIds)
}

export async function updateMemberMergeSuggestionsLastGeneratedAt(
  segmentId: string,
): Promise<void> {
  const segmentRepo = new SegmentRepository(svc.postgres.writer.connection(), svc.log)
  await segmentRepo.updateDashboardCacheLastRefreshedAt(segmentId)
}

export async function getNewMembersNumber(params: IGraphQueryParams): Promise<number> {
  let result = 0
  try {
    result = await getNumberOfNewMembers(svc.postgres.reader, {
      tenantId: params.tenantId,
      segmentIds: params.segmentIds,
      after: params.startDate,
      before: params.endDate,
      platform: params.platform,
    })
  } catch (err) {
    throw new Error(err)
  }

  return result
}

export async function getNewMembersTimeseries(
  params: IGraphQueryParams,
): Promise<INewMembersTimeseriesResult[]> {
  let result: INewMembersTimeseriesResult[]

  try {
    const rows = await countMembersWithActivities(svc.questdbSQL, {
      tenantId: params.tenantId,
      segmentIds: params.segmentIds,
      timestampFrom: params.startDate,
      timestampTo: params.endDate,
      platform: params.platform,
      groupBy: 'day',
    })

    const mapped: Record<string, INewMembersTimeseriesResult> = {}
    rows.forEach((row) => {
      if (!mapped[row.date]) {
        mapped[row.date] = {
          date: row.date,
          count: Number(row.count),
        }
      } else {
        mapped[row.date]['count'] = Number(mapped[row.date]['count']) + Number(row.count)
      }
    })

    result = Object.values(mapped)
  } catch (err) {
    throw new Error(err)
  }

  return result
}

export async function getActiveMembersNumber(params: IGraphQueryParams): Promise<number> {
  let result = 0
  try {
    const rows = await countMembersWithActivities(svc.questdbSQL, {
      tenantId: params.tenantId,
      segmentIds: params.segmentIds,
      timestampFrom: params.startDate,
      timestampTo: params.endDate,
      platform: params.platform,
      groupBy: 'day',
    })

    rows.forEach((row) => {
      result += Number(row.count)
    })
  } catch (err) {
    throw new Error(err)
  }

  return result
}

export async function getActiveMembersTimeseries(
  params: IGraphQueryParams,
): Promise<IActiveMembersTimeseriesResult[]> {
  let result: IActiveMembersTimeseriesResult[]
  try {
    result = await getTimeseriesOfActiveMembers(qdb, {
      tenantId: params.tenantId,
      segmentIds: params.segmentIds,
      after: params.startDate,
      before: params.endDate,
      platform: params.platform,
    })
  } catch (err) {
    throw new Error(err)
  }

  return result
}

export async function getNewOrganizationsNumber(params: IGraphQueryParams): Promise<number> {
  let result = 0
  try {
    result = await getNumberOfNewOrganizations(svc.postgres.reader, {
      tenantId: params.tenantId,
      segmentIds: params.segmentIds,
      after: params.startDate,
      before: params.endDate,
      platform: params.platform,
    })
  } catch (err) {
    throw new Error(err)
  }

  return result
}

export async function getNewOrganizationsTimeseries(
  params: IGraphQueryParams,
): Promise<INewOrganizationsTimeseriesResult[]> {
  let result: INewOrganizationsTimeseriesResult[]

  try {
    const rows = await countOrganizationsWithActivities(svc.questdbSQL, {
      tenantId: params.tenantId,
      segmentIds: params.segmentIds,
      timestampFrom: params.startDate,
      timestampTo: params.endDate,
      platform: params.platform,
    })

    const mapped: Record<string, INewOrganizationsTimeseriesResult> = {}
    rows.forEach((row) => {
      if (!mapped[row.date]) {
        mapped[row.date] = {
          date: row.date,
          count: Number(row.count),
        }
      } else {
        mapped[row.date]['count'] = Number(mapped[row.date]['count']) + Number(row.count)
      }
    })

    result = Object.values(mapped)
  } catch (err) {
    throw new Error(err)
  }

  return result
}

export async function getActiveOrganizationsNumber(params: IGraphQueryParams): Promise<number> {
  let result = 0
  try {
    result = await getNumberOfActiveOrganizations(qdb, {
      tenantId: params.tenantId,
      segmentIds: params.segmentIds,
      after: params.startDate,
      before: params.endDate,
      platform: params.platform,
    })
  } catch (err) {
    throw new Error(err)
  }

  return result
}

export async function getActiveOrganizationsTimeseries(
  params: IGraphQueryParams,
): Promise<IActiveOrganizationsTimeseriesResult[]> {
  let result: IActiveOrganizationsTimeseriesResult[]
  try {
    result = await getTimeseriesOfActiveOrganizations(qdb, {
      tenantId: params.tenantId,
      segmentIds: params.segmentIds,
      after: params.startDate,
      before: params.endDate,
      platform: params.platform,
    })
  } catch (err) {
    throw new Error(err)
  }

  return result
}

export async function getActivitiesNumber(params: IGraphQueryParams): Promise<number> {
  let result = 0
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filters: any[] = [
      {
        timestamp: {
          gte: params.startDate,
        },
      },
      {
        timestamp: {
          lte: params.endDate,
        },
      },
    ]

    if (params.platform) {
      filters.push({
        platform: {
          eq: params.platform,
        },
      })
    }

    const res = await queryActivities(svc.questdbSQL, {
      tenantId: params.tenantId,
      segmentIds: params.segmentIds,
      countOnly: true,
      filter: {
        and: filters,
      },
    })

    result = res.count
  } catch (err) {
    throw new Error(err)
  }

  return result
}

export async function getActivitiesTimeseries(
  params: IGraphQueryParams,
): Promise<IActivityTimeseriesResult[]> {
  let result: IActivityTimeseriesResult[]

  try {
    result = await activitiesTimeseries(svc.questdbSQL, {
      tenantId: params.tenantId,
      segmentIds: params.segmentIds,
      after: params.startDate,
      before: params.endDate,
      platform: params.platform,
    })
  } catch (err) {
    throw new Error(err)
  }

  return result
}
export async function getActivitiesBySentiment(
  params: IGraphQueryParams,
): Promise<IActivityBySentimentMoodResult[]> {
  let result: IActivityBySentimentMoodResult[]

  try {
    result = await activitiesBySentiment(svc.questdbSQL, {
      tenantId: params.tenantId,
      segmentIds: params.segmentIds,
      after: params.startDate,
      before: params.endDate,
      platform: params.platform,
    })
  } catch (err) {
    throw new Error(err)
  }

  return result
}
export async function getActivitiesByType(
  params: IGraphQueryParams,
): Promise<IActivityByTypeAndPlatformResult[]> {
  let result: IActivityByTypeAndPlatformResult[]

  try {
    result = await activitiesByTypeAndPlatform(svc.questdbSQL, {
      tenantId: params.tenantId,
      segmentIds: params.segmentIds,
      after: params.startDate,
      before: params.endDate,
      platform: params.platform,
    })
  } catch (err) {
    throw new Error(err)
  }

  return result
}

export async function saveToCache(
  tenantId: string,
  segmentId: string,
  timeframe: DashboardTimeframe,
  cacheData: IDashboardData,
  platform?: string,
): Promise<void> {
  const redisCache = new RedisCache(`dashboard-cache`, svc.redis, svc.log)
  let key = `${tenantId}:${segmentId}:${timeframe}`
  if (platform) {
    key += `:${platform}`
  }
  await redisCache.set(key, JSON.stringify(cacheData))
}
