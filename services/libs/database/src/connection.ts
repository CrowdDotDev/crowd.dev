import pgPromise from 'pg-promise'

import { IS_CLOUD_ENV, IS_DEV_ENV } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'

import { DbConnection, DbInstance, IDatabaseConfig } from './types'

const log = getServiceChildLogger('database.connection')

let dbInstance: DbInstance | undefined

export const getDbInstance = (): DbInstance => {
  if (dbInstance) {
    return dbInstance
  }

  log.trace('Creating database library instance!')

  dbInstance = pgPromise({
    // tslint:disable-next-line:max-line-length
    // see https://stackoverflow.com/questions/36120435/verify-database-connection-with-pg-promise-when-starting-an-app
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async error(err: any, e: pgPromise.IEventContext): Promise<void> {
      if (e.cn) {
        log.fatal(err, { cn: e.cn }, 'PostgreSQL connection error. Stopping process')
        // logs don't have flush:
        await new Promise((resolve) => setTimeout(resolve, 100))
        process.nextTick(() => process.exit())
      }

      if (e.query) {
        log.error(err, { query: e.query, params: e.params }, 'Error executing a PostgreSQL query!')
      }
    },
    query(e) {
      log.debug({ query: e.query, params: e.params }, 'Executing PostgreSQL query')
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((dbInstance.pg as any).usingSequelize) {
    return dbInstance
  }

  // timestamp
  dbInstance.pg.types.setTypeParser(1114, (s) => s)

  // timestamp with timezone
  dbInstance.pg.types.setTypeParser(1184, (s) => s)

  // numeric
  dbInstance.pg.types.setTypeParser(1700, (s) => parseFloat(s))

  // int4
  dbInstance.pg.types.setTypeParser(23, (s) => parseInt(s, 10))

  return dbInstance
}

const dbConnection: Record<string, DbConnection | undefined> = {}

export const getDbConnection = async (
  config: IDatabaseConfig,
  maxPoolSize?: number,
  idleTimeoutMillis?: number,
): Promise<DbConnection> => {
  const cacheKey = `${config.host}:${config.database}`
  if (dbConnection[cacheKey]) {
    return dbConnection[cacheKey]
  }

  log.info(
    { database: config.database, host: config.host, port: config.port },
    'Connecting to database!',
  )

  const dbInstance = getDbInstance()

  dbConnection[cacheKey] = dbInstance({
    ...config,
    ssl: IS_CLOUD_ENV
      ? {
          rejectUnauthorized: false,
        }
      : false,
    max: maxPoolSize || (IS_DEV_ENV ? 5 : 20),
    idleTimeoutMillis: idleTimeoutMillis !== undefined ? idleTimeoutMillis : 10000,
    // query_timeout: 30000,
    application_name: process.env.SERVICE ? `${process.env.SERVICE}-pg` : 'unknown-app=pg',
  })

  return dbConnection[cacheKey]
}
