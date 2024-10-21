import { Gitlab, SimpleUserSchema, UserSchema } from '@gitbeaker/rest'

import type { IProcessStreamContext } from '../../../types'
import { RedisSemaphore } from '../utils/lock'

export const getUser = async (
  api: InstanceType<typeof Gitlab>,
  userId: number,
  ctx: IProcessStreamContext,
) => {
  const cacheKey = `gitlab:user:${userId}`
  const cachedUser = await ctx.cache.get(cacheKey)

  if (cachedUser) {
    return JSON.parse(cachedUser) as UserSchema
  }

  const semaphore = new RedisSemaphore({
    integrationId: ctx.integration.id,
    apiCallType: 'getUser',
    maxConcurrent: 1,
    cache: ctx.cache,
  })

  let user: UserSchema

  try {
    await semaphore.acquire()
    user = (await api.Users.show(userId)) as UserSchema
  } catch (error) {
    ctx.log.error(error, 'Failed to get user', userId)
    throw error
  } finally {
    await semaphore.release()
  }

  await ctx.cache.set(cacheKey, JSON.stringify(user), 24 * 60 * 60) // TTL set for one day (24 hours)

  return user as UserSchema
}

export const getUserByUsername = async (
  api: InstanceType<typeof Gitlab>,
  username: string,
  ctx: IProcessStreamContext,
) => {
  const cacheKey = `gitlab:user:username:${username}`
  const cachedUser = await ctx.cache.get(cacheKey)

  if (cachedUser) {
    return JSON.parse(cachedUser) as UserSchema
  }

  const semaphore = new RedisSemaphore({
    integrationId: ctx.integration.id,
    apiCallType: 'getUserByUsername',
    maxConcurrent: 1,
    cache: ctx.cache,
  })

  let users: SimpleUserSchema[]

  try {
    await semaphore.acquire()
    users = (await api.Search.all('users', username)) as SimpleUserSchema[]
  } finally {
    await semaphore.release()
  }

  // iterate over users and return the first one that has the same username
  const user = users.find((u) => u.username === username)

  if (!user) {
    throw new Error(`User ${username} not found`)
  }

  const fullUser = await getUser(api, user.id, ctx)

  await ctx.cache.set(cacheKey, JSON.stringify(fullUser), 24 * 60 * 60) // TTL set for one day (24 hours)

  return fullUser
}
