import { TimeoutError, timeout } from '@crowd/common'
import { RedisClient } from './types'
import { generateUUIDv4 } from '@crowd/common'

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

    // Randomize timeout between 100ms and 300ms
    const randomTimeout = Math.floor(Math.random() * (300 - 100 + 1)) + 100
    await timeout(randomTimeout)
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

export const processWithLock = async <T = void>(
  client: RedisClient,
  key: string,
  expireAfterSeconds: number,
  timeoutAfterSeconds: number,
  process: () => Promise<T>,
): Promise<T | void> => {
  const value = generateUUIDv4()

  await acquireLock(client, key, value, expireAfterSeconds, timeoutAfterSeconds)

  // TODO: we can add logic to extend the lock here if we want to

  let result: T | void
  try {
    result = await process()
  } finally {
    await releaseLock(client, key, value)
  }
  return result
}
