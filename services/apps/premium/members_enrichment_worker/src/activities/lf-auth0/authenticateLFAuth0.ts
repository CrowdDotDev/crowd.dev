import { AuthenticationClient } from 'auth0'
import { svc } from '../../main'
import { RedisCache } from '@crowd/redis'
import { ITokenWithExpiration } from '../../types/lfid-enrichment'

export async function refreshToken(token?: string): Promise<string> {
  const redisCache = new RedisCache(`lfx-auth0`, svc.redis, svc.log)
  const tokenFromRedis = await redisCache.get('access-token')

  if (!token) {
    if (tokenFromRedis) {
      return tokenFromRedis
    }
    const tokenFromAuth0 = await getTokenFromAuth0()
    await saveTokenToRedis(tokenFromAuth0, redisCache)
    return tokenFromAuth0.token
  }

  // if token is sent along with the function, check if sent token is same as redis token
  if (token === tokenFromRedis) {
    const tokenFromAuth0 = await getTokenFromAuth0()
    await saveTokenToRedis(tokenFromAuth0, redisCache)
    return tokenFromAuth0.token
  }

  return tokenFromRedis
}

async function saveTokenToRedis(
  token: ITokenWithExpiration,
  redisCache: RedisCache,
): Promise<void> {
  await redisCache.set('access-token', token.token, token.expirationInSeconds)
}

async function getTokenFromAuth0(): Promise<ITokenWithExpiration> {
  const auth = new AuthenticationClient({
    domain: process.env['CROWD_LFX_AUTH0_DOMAIN'],
    clientId: process.env['CROWD_LFX_AUTH0_CLIENT_ID'],
    clientAssertionSigningKey: process.env['CROWD_LFX_AUTH0_CLIENT_ASSERTION_SIGNING_KEY'],
  })

  const result = await auth.oauth.clientCredentialsGrant({
    audience: process.env['CROWD_LFX_AUTH0_AUDIENCE'],
  })

  if (result.data) {
    return {
      token: result.data.access_token,
      expirationInSeconds: result.data.expires_in,
    }
  }

  svc.log.error({ result }, 'Failed to get token from Auth0!')
  return null
}
