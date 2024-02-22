import { svc } from '../../main'
import { ICubeQueryParams, IDashboardData } from '../../types'
import { ISegment } from '@crowd/data-access-layer/src/old/apps/cache_worker/types'
import SegmentRepository from '@crowd/data-access-layer/src/old/apps/cache_worker/segment.repo'
import { CubeJsRepository, CubeJsService } from '@crowd/cubejs'
import { RedisCache } from '@crowd/redis'
import { DashboardTimeframe } from '@crowd/types'
import moment from 'moment'
import IntegrationRepository from '@crowd/data-access-layer/src/old/apps/cache_worker/integration.repo'
import ActivityRepository from '@crowd/data-access-layer/src/old/apps/cache_worker/activity.repo'

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

export async function getNewMembers<T>(params: ICubeQueryParams): Promise<T> {
  const cjs = new CubeJsService()
  await cjs.init(params.tenantId, params.segmentIds)

  let result: T
  try {
    result = await CubeJsRepository.getNewMembers(
      cjs,
      moment(params.startDate),
      moment(params.endDate),
      params.granularity,
      {
        platform: params.platform,
      },
      {},
      params.rawResult,
    )
  } catch (err) {
    throw new Error(err)
  }

  return result
}

export async function getActiveMembers<T>(params: ICubeQueryParams): Promise<T> {
  const cjs = new CubeJsService()
  await cjs.init(params.tenantId, params.segmentIds)

  let result: T
  try {
    result = await CubeJsRepository.getActiveMembers(
      cjs,
      moment(params.startDate),
      moment(params.endDate),
      params.granularity,
      {
        platform: params.platform,
      },
      {},
      params.rawResult,
    )
  } catch (err) {
    throw new Error(err)
  }

  return result
}

export async function getNewOrganizations<T>(params: ICubeQueryParams): Promise<T> {
  const cjs = new CubeJsService()
  await cjs.init(params.tenantId, params.segmentIds)

  let result: T
  try {
    result = await CubeJsRepository.getNewOrganizations(
      cjs,
      moment(params.startDate),
      moment(params.endDate),
      params.granularity,
      {
        platform: params.platform,
      },
      {},
      params.rawResult,
    )
  } catch (err) {
    throw new Error(err)
  }

  return result
}

export async function getActiveOrganizations<T>(params: ICubeQueryParams): Promise<T> {
  const cjs = new CubeJsService()
  await cjs.init(params.tenantId, params.segmentIds)

  let result: T
  try {
    result = await CubeJsRepository.getActiveOrganizations(
      cjs,
      moment(params.startDate),
      moment(params.endDate),
      params.granularity,
      {
        platform: params.platform,
      },
      {},
      params.rawResult,
    )
  } catch (err) {
    throw new Error(err)
  }

  return result
}

export async function getActivities<T>(params: ICubeQueryParams): Promise<T> {
  const cjs = new CubeJsService()
  await cjs.init(params.tenantId, params.segmentIds)

  let result: T
  try {
    result = await CubeJsRepository.getNewActivities(
      cjs,
      moment(params.startDate),
      moment(params.endDate),
      params.granularity,
      params.dimensions,
      {
        platform: params.platform,
      },
      params.order,
      params.rawResult,
    )
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
