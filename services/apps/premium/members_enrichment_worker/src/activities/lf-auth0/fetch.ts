import { ManagementClient, GetUsers200ResponseOneOfInner } from 'auth0'
import { svc } from '../../main'
import { RedisCache, acquireLock, releaseLock } from '@crowd/redis'
import { randomUUID } from 'crypto'
import { IMember, MemberIdentityType } from '@crowd/types'
import { IGetEnrichmentDataResponse } from '../../types/lfid-enrichment'

// We'll keep the remaining rate limits in redisCache(lfx-auth0)
// This key will keep the results from the last request:
// x-ratelimit-reset, x-ratelimit-remaining, x-ratelimit-limit
// The access to this key will be protected by a mutex lock, only one api call at a time
// will be allowed to update this key, preventing race conditions to the rate limit redis key
export async function get(token: string, member: IMember): Promise<GetUsers200ResponseOneOfInner> {
  const MUTEX_LOCK_KEY = 'lfx-auth0-mutex'
  const lockValue = randomUUID()
  let result: IGetEnrichmentDataResponse

  try {
    // redis cache for rate limits
    const rateLimitCache = new RedisCache(`lfx-auth0`, svc.redis, svc.log)

    // acquire redis lock
    await acquireLock(svc.redis, MUTEX_LOCK_KEY, lockValue, 60, 100)

    // check redis rate limit
    const rateLimit = await rateLimitCache.get('remaining-requests')

    // if nothing found
    if (rateLimit && Number.parseInt(rateLimit, 10) <= 1) {
      throw new Error('Soft rate limit exceeded. Starting exponential backoff and retrying!')
    }

    result = await getEnrichmentData(token, member)

    // update rate limit cache
    if (result?.rateLimit) {
      const ttl = Number.parseInt(result.rateLimit.reset, 10) - Math.floor(Date.now() / 1000)
      if (ttl > 0) {
        console.log(`Setting remaining-requests to ${result.rateLimit.remaining} with ttl ${ttl}!`)
        await rateLimitCache.set('remaining-requests', result.rateLimit.remaining, ttl)
      }
    }
  } catch (e) {
    result = null
    // svc.log.error('Error when getting user from lfx-auth0', e)
    throw e
  } finally {
    await releaseLock(svc.redis, MUTEX_LOCK_KEY, lockValue)
  }

  // we can release the lock now
  return result?.user || null
}

async function getEnrichmentData(
  token: string,
  member: IMember,
): Promise<IGetEnrichmentDataResponse> {
  const management = new ManagementClient({
    token,
    domain: process.env['CROWD_LFX_AUTH0_DOMAIN'],
    audience: process.env['CROWD_LFX_AUTH0_AUDIENCE'],
  })

  const githubIdentity = member.identities?.find((i) => i.platform === 'github') || null

  const linkedinIdentity = member.identities?.find((i) => i.platform === 'linkedin') || null

  const lfidIdentity =
    member.identities?.find(
      (i) =>
        (i.platform === 'lfid' || i.platform === 'tnc' || i.platform === 'cvent') &&
        i.type === MemberIdentityType.USERNAME,
    ) || null

  const emailIdentity =
    member.identities?.find((i) => i.type === MemberIdentityType.EMAIL && i.verified === true) ||
    null

  let innerQuery
  let enrichedBySource = null
  let enrichedBySourceId = null

  if (lfidIdentity) {
    enrichedBySource = 'lfid'
    enrichedBySourceId = lfidIdentity.value
    innerQuery = `username:"${escapeCharacters(lfidIdentity.value)}"`
  } else if (githubIdentity) {
    enrichedBySource = 'github'
    // check if sourceId for the github identity exists, if it doesn't get it from the github api
    if (githubIdentity.sourceId) {
      enrichedBySourceId = githubIdentity.sourceId
      innerQuery = `identities.user_id:"${escapeCharacters(githubIdentity.sourceId)}"`
    }
  } else if (linkedinIdentity && linkedinIdentity.sourceId) {
    enrichedBySource = 'linkedin'
    enrichedBySourceId = linkedinIdentity.sourceId
    innerQuery = `identities.user_id:"${escapeCharacters(linkedinIdentity.sourceId)}"`
  } else if (emailIdentity) {
    enrichedBySource = 'email'
    innerQuery = `email:"${escapeCharacters(emailIdentity.value)}"`
  }

  if (!innerQuery) {
    svc.log.warn(`Enrichment query can't be generated for ${member.id}!`)
    return null
  }

  const result = await management.users.getAll({
    q: `identities.connection:"Username-Password-Authentication" AND email_verified:true AND ( ${innerQuery} )`,
  })

  const user = result.data?.[0] || null

  const response = {
    user: null,
    rateLimit: {
      reset: result.headers.get('x-ratelimit-reset'),
      remaining: result.headers.get('x-ratelimit-remaining'),
      limit: result.headers.get('x-ratelimit-limit'),
    },
  }

  if (user) {
    if (enrichedBySource === 'email' || enrichedBySource === 'lfid') {
      response.user = user
    }

    if (enrichedBySource === 'github' || enrichedBySource === 'linkedin') {
      // we need to cross check returned identities and make sure that the identity returned is in the correct platform
      // because when querying identities, we can't specify the platforms

      if (
        user.identities.some(
          (i) => i.provider === enrichedBySource && i.user_id === enrichedBySourceId,
        )
      ) {
        response.user = user
      }
    }
  }

  return response
}

function escapeCharacters(str: string): string {
  return str
    .replace(/\\/g, '\\\\') // replace \ with \\
    .replace(/"/g, '\\"') // replace " with \"
}
