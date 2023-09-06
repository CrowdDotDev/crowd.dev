import { TimeoutError, timeout } from '@crowd/common'
import { RedisClient } from './types'

export const acquireLock = async (
  client: RedisClient,
  key: string,
  value: string,
  expireAfterSeconds: number,
  timeoutAfterSeconds: number,
): Promise<void> => {
  const now = new Date().getTime()

  let result = await client.set(key, value, {
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
    result = await client.set(key, value, {
      EX: expireAfterSeconds,
      NX: true,
    })
  }
}

export const releaseLock = async (
  client: RedisClient,
  key: string,
  value: string,
): Promise<void> => {
  const script = `
    if redis.call("get",KEYS[1]) == ARGV[1] then
      return redis.call("del",KEYS[1])
    else
      return 0
    end
  `
  await client.eval(script, {
    keys: [key],
    arguments: [value],
  })
}
