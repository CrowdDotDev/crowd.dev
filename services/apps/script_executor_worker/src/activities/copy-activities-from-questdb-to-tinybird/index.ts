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
  segmentIds: string[],
) {
  const activities = await getActivitiesSortedByTimestamp(
    svc.questdbSQL,
    latestSyncedActivityTimestamp,
    segmentIds,
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

/**
 * Sanitize strings to remove invalid Unicode surrogate pairs
 */
function sanitizeUnicodeForJson(obj) {
  if (typeof obj === 'string') {
    // Remove lone surrogates that break JSON
    return obj.replace(
      /([\uD800-\uDBFF](?![\uDC00-\uDFFF]))|((?<![\uD800-\uDBFF])[\uDC00-\uDFFF])/g,
      '',
    )
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeUnicodeForJson)
  }
  if (obj && typeof obj === 'object') {
    const sanitized = {}

    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeUnicodeForJson(value)
    }
    return sanitized
  }
  return obj
}

/**
 * Recursively ensures nested JSON fields are parsed as objects
 */
function parseNestedJsonFields(obj, nestedKeys = ['attributes']) {
  const parsed = { ...obj }
  for (const key of nestedKeys) {
    if (parsed[key] && typeof parsed[key] === 'string') {
      try {
        parsed[key] = JSON.parse(parsed[key])
      } catch {
        // leave as string if it can't be parsed
      }
    }
  }
  return parsed
}

/**
 * Prepare a payload for Tinybird ingestion
 */
function prepareForTinybird(payload, nestedKeys = ['attributes']) {
  // 1. Parse nested JSON fields
  const parsed = parseNestedJsonFields(payload, nestedKeys)

  // 2. Sanitize all strings (removes invalid surrogate pairs)
  const sanitized = sanitizeUnicodeForJson(parsed)

  return sanitized
}

export async function sendActivitiesToTinybird(activitiesRedisKey: string): Promise<void> {
  let response
  const activities = await getActivitiyDataFromRedis(activitiesRedisKey)

  try {
    const url = `https://api.us-west-2.aws.tinybird.co/v0/events?name=activities`

    // Sanitize activities to remove invalid Unicode and handle null sourceId
    const sanitizedActivities = activities.map((activity) => {
      const sanitized = prepareForTinybird(activity)
      // Default sourceId to empty string if null
      if (sanitized.sourceId === null || sanitized.sourceId === undefined) {
        sanitized.sourceId = ''
      }
      return sanitized
    })

    const config = {
      method: 'post',
      url,
      data: sanitizedActivities.map((a) => JSON.stringify(a)).join('\n'),
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
      svc.log.warn(
        `Axios error occurred while sending activities to tinybird. ${err.response?.status} - ${err.response?.statusText}`,
      )
      throw new Error(`Sending data to tinybird failed with status: ${err.response?.status}`)
    } else {
      svc.log.error(`Unexpected error while sending data to tinybird: ${err}`)
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
