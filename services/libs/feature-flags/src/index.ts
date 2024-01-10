import { EDITION } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'
import { RedisCache, RedisClient } from '@crowd/redis'
import { Edition, FeatureFlag } from '@crowd/types'
import { Context, Unleash } from 'unleash-client'

export interface IUnleashConfig {
  url: string
  appName: string
  apiKey: string
}

const log = getServiceChildLogger('feature-flags')

let unleash: Unleash | undefined
export const getUnleashClient = async (cfg: IUnleashConfig): Promise<Unleash | undefined> => {
  if (EDITION !== Edition.CROWD_HOSTED) {
    return undefined
  }

  if (unleash) {
    return unleash
  }

  unleash = new Unleash({
    url: `${cfg.url}/api`,
    appName: cfg.appName,
    customHeaders: {
      Authorization: cfg.apiKey,
    },
  })

  unleash.on('error', (err) => {
    log.error(err, 'Unleash client error! Feature flags might not work correctly!')
  })

  let isReady = false

  const interval = setInterval(async () => {
    if (!isReady) {
      log.error('Unleash client is not ready yet, exiting...')
      process.exit(1)
    }
  }, 60 * 1000)

  await new Promise<void>((resolve) => {
    unleash.on('ready', () => {
      clearInterval(interval)
      log.info('Unleash client is ready!')
      isReady = true
      resolve()
    })
  })

  return unleash
}

export const isFeatureEnabled = async (
  flag: FeatureFlag,
  contextLoader: UnleashContextLoader,
  client?: Unleash,
  redis?: RedisClient,
  redisTimeoutSeconds?: number,
  cacheKey?: string,
): Promise<boolean> => {
  if (flag === FeatureFlag.SEGMENTS) {
    return EDITION === Edition.LFX
  }

  if ([Edition.LFX, Edition.COMMUNITY].includes(EDITION)) {
    return true
  }

  if (!client) {
    throw new Error('Unleash client is not initialized!')
  }

  let cache: RedisCache | undefined

  if (redis && redisTimeoutSeconds && cacheKey) {
    cache = new RedisCache('feature-flags', redis, log)
    const result = await cache.get(`${flag}-${cacheKey}`)
    if (result) {
      return result === 'true'
    }
  }

  const enabled = unleash.isEnabled(flag, await contextLoader())

  if (cache) {
    await cache.set(`${flag}-${cacheKey}`, enabled.toString(), redisTimeoutSeconds || 60)
  }

  return enabled
}

export * from 'unleash-client'

export type UnleashClient = Unleash
export type UnleashContextLoader = () => Promise<Context>
