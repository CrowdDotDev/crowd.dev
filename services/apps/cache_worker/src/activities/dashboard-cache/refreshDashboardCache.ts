import {
  activitiesBySentiment,
  activitiesByTypeAndPlatform,
  activitiesTimeseries,
  getTimeseriesOfActiveMembers,
  getTimeseriesOfNewMembers,
  queryActivityRelations,
} from '@crowd/data-access-layer'
import { DbStore } from '@crowd/data-access-layer/src/database'
import ActivityRepository from '@crowd/data-access-layer/src/old/apps/cache_worker/activity.repo'
import IntegrationRepository from '@crowd/data-access-layer/src/old/apps/cache_worker/integration.repo'
import SegmentRepository from '@crowd/data-access-layer/src/old/apps/cache_worker/segment.repo'
import { ISegment } from '@crowd/data-access-layer/src/old/apps/cache_worker/types'
import {
  getTimeseriesOfActiveOrganizations,
  getTimeseriesOfNewOrganizations,
} from '@crowd/data-access-layer/src/organizations'
import { dbStoreQx, pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { RedisCache } from '@crowd/redis'
import {
  DashboardTimeframe,
  IActivityBySentimentMoodResult,
  IActivityByTypeAndPlatformResult,
  IDashboardData,
  IQueryTimeseriesParams,
  ITimeseriesDatapoint,
} from '@crowd/types'

import { svc } from '../../main'

const qdb = new DbStore(svc.log, svc.questdbSQL)

export async function getDashboardCacheLastRefreshedAt(segmentId: string): Promise<string> {
  const segmentRepo = new SegmentRepository(svc.postgres.writer.connection(), svc.log)
  return segmentRepo.getDashboardCacheLastRefreshedAt(segmentId)
}

export async function getDefaultSegment(): Promise<ISegment> {
  const segmentRepo = new SegmentRepository(svc.postgres.writer.connection(), svc.log)
  return segmentRepo.getDefaultSegment()
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

export async function getNewMembersTimeseries(
  params: IQueryTimeseriesParams,
): Promise<ITimeseriesDatapoint[]> {
  return getTimeseriesOfNewMembers(dbStoreQx(svc.postgres.reader), params)
}

export async function getActiveMembersTimeseries(
  params: IQueryTimeseriesParams,
): Promise<ITimeseriesDatapoint[]> {
  return getTimeseriesOfActiveMembers(dbStoreQx(qdb), params)
}

export async function getNewOrganizationsTimeseries(
  params: IQueryTimeseriesParams,
): Promise<ITimeseriesDatapoint[]> {
  return getTimeseriesOfNewOrganizations(dbStoreQx(svc.postgres.reader), params)
}

export async function getActiveOrganizationsTimeseries(
  params: IQueryTimeseriesParams,
): Promise<ITimeseriesDatapoint[]> {
  return getTimeseriesOfActiveOrganizations(dbStoreQx(qdb), params)
}

export async function getActivitiesNumber(params: IQueryTimeseriesParams): Promise<number> {
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

    const qx = pgpQx(svc.postgres.reader.connection())
    const res = await queryActivityRelations(qx, {
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
  params: IQueryTimeseriesParams,
): Promise<ITimeseriesDatapoint[]> {
  let result: ITimeseriesDatapoint[]

  try {
    result = await activitiesTimeseries(svc.questdbSQL, {
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
  params: IQueryTimeseriesParams,
): Promise<IActivityBySentimentMoodResult[]> {
  let result: IActivityBySentimentMoodResult[]

  try {
    result = await activitiesBySentiment(svc.questdbSQL, {
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
  params: IQueryTimeseriesParams,
): Promise<IActivityByTypeAndPlatformResult[]> {
  let result: IActivityByTypeAndPlatformResult[]

  try {
    result = await activitiesByTypeAndPlatform(svc.questdbSQL, {
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
  segmentId: string,
  timeframe: DashboardTimeframe,
  cacheData: IDashboardData,
  platform?: string,
): Promise<void> {
  const redisCache = new RedisCache(`dashboard-cache`, svc.redis, svc.log)
  let key = `${segmentId}:${timeframe}`
  if (platform) {
    key += `:${platform}`
  }
  await redisCache.set(key, JSON.stringify(cacheData))
}
