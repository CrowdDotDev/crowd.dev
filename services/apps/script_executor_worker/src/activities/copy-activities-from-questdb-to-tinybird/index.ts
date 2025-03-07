import axios from 'axios'

import { getActivitiesSortedByTimestamp } from '@crowd/data-access-layer'
import { RedisCache } from '@crowd/redis'

import { svc } from '../../main'

export async function resetIndexedIdentitiesForSyncingActivitiesToTinybird(): Promise<void> {
  const redisCache = new RedisCache(`sync-activities-to-tinybird`, svc.redis, svc.log)
  await redisCache.delete('latest-synced-activity-timestamp')
}

export async function getLatestSyncedActivityTimestampForSyncingActivitiesToTinybird(): Promise<string> {
  const redisCache = new RedisCache(`sync-activities-to-tinybird`, svc.redis, svc.log)
  const result = await redisCache.get('latest-synced-activity-timestamp')
  return result || null
}

export async function markActivitiesAsIndexedForSyncingActivitiesToTinybird(
  activitiesRedisKey: string,
): Promise<void> {
  const activities = await getActivitiyDataFromRedis(activitiesRedisKey)
  const redisCache = new RedisCache(`sync-activities-to-tinybird`, svc.redis, svc.log)
  const lastSyncedTimestamp = activities[activities.length - 1].timestamp
  await redisCache.set('latest-synced-activity-timestamp', lastSyncedTimestamp)
  return lastSyncedTimestamp
}

export async function getActivitiesToCopyToTinybird(
  latestSyncedActivityTimestamp: string,
  limit: number,
) {
  const activities = await getActivitiesSortedByTimestamp(
    svc.questdbSQL,
    latestSyncedActivityTimestamp,
    limit,
  )

  if (activities.length === 0) {
    return null
  }

  // generate a random key
  const key = Math.random().toString(36).substring(7)
  await saveActivityDataToRedis(key, activities)

  return {
    activitiesRedisKey: key,
    activitiesLength: activities.length,
    lastTimestamp: activities[activities.length - 1].timestamp,
  }
}

export async function sendActivitiesToTinybird(activitiesRedisKey: string): Promise<void> {
  let response
  const activities = await getActivitiyDataFromRedis(activitiesRedisKey)

  try {
    const url = `https://api.us-west-2.aws.tinybird.co/v0/events?name=activities`
    const config = {
      method: 'post',
      url,
      data: activities.map((a) => JSON.stringify(a)).join('\n'),
      headers: {
        Authorization: `Bearer ${process.env['CROWD_TINYBIRD_ACCESS_TOKEN']}`,
      },
      validateStatus: function (status) {
        return (status >= 200 && status < 300) || status === 404 || status === 422
      },
    }

    response = (await axios(config)).data
    console.log(`Data sent to tinybird ->  ${JSON.stringify(response)}`)
  } catch (err) {
    if (axios.isAxiosError(err)) {
      this.log.warn(
        `Axios error occurred while sending activities to tinybird. ${err.response?.status} - ${err.response?.statusText}`,
      )
      throw new Error(`Sending data to tinybird failed with status: ${err.response?.status}`)
    } else {
      this.log.error(`Unexpected error while sending data to tinybird: ${err}`)
      throw new Error('An unexpected error occurred')
    }
  }

  return response
}

export async function saveActivityDataToRedis(key: string, activities): Promise<void> {
  const redisCache = new RedisCache(`sync-activities-to-tinybird`, svc.redis, svc.log)
  await redisCache.set(key, JSON.stringify(activities), 30)
}

export async function getActivitiyDataFromRedis(key: string) {
  const redisCache = new RedisCache(`sync-activities-to-tinybird`, svc.redis, svc.log)
  const result = await redisCache.get(key)
  return JSON.parse(result)
}
