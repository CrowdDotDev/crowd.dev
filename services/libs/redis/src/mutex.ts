import { TimeoutError, timeout } from '@crowd/common'
import { RedisClient } from './types'

export const aquireLock = async (
  client: RedisClient,
  key: string,
  expireAfterSeconds: number,
  timeoutAfterSeconds: number,
): Promise<void> => {
  const now = new Date().getTime()

  let result = await client.set(key, 'lock', {
    EX: expireAfterSeconds,
    NX: true,
  })
  while (!result) {
    const time = new Date().getTime()
    const diff = time - now
    if (diff > timeoutAfterSeconds * 1000) {
      throw new TimeoutError(diff / 1000, 's')
    }

    await timeout(200)
    result = await client.set(key, 'lock', {
      EX: expireAfterSeconds,
      NX: true,
    })
  }
}

export const releaseLock = async (client: RedisClient, key: string): Promise<void> => {
  await client.del(key)
}
