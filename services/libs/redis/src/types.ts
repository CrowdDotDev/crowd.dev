import { RedisClientType, RedisDefaultModules } from 'redis'

export type RedisClient = RedisClientType<RedisDefaultModules>

export interface IRedisConfiguration {
  username: string
  password: string
  host: string
  port: string
}
