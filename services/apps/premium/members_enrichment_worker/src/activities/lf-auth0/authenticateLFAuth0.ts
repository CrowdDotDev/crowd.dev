import { AuthenticationClient } from 'auth0'
import { svc } from '../../main'
import { RedisCache } from '@crowd/redis'
import { ITokenWithExpiration } from '../../types/lfid-enrichment'

export async function refreshToken(): Promise<string> {
  const redisCache = new RedisCache(`lfx-auth0`, svc.redis, svc.log)
  const tokenFromRedis = await redisCache.get('access-token')

  if (tokenFromRedis) {
    return tokenFromRedis
  }
  const tokenFromAuth0 = await getTokenFromAuth0()
  await saveTokenToRedis(tokenFromAuth0, redisCache)
  return tokenFromAuth0.token
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

  if (result.data && result.data.access_token && result.data.expires_in) {
    return {
      token: result.data.access_token,
      expirationInSeconds: result.data.expires_in,
    }
  }

  svc.log.error({ result }, 'Failed to get token from Auth0!')
  throw new Error('Failed to get token from Auth0!')
}
