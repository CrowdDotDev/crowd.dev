import { getServiceChildLogger } from '@crowd/logging'
import { DbConnection, DbInstance, IDatabaseConfig } from './types'
import pgPromise from 'pg-promise'

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
        if (log !== undefined) log.fatal(err, { cn: e.cn }, 'DB connection error. Stopping process')
        // logs don't have flush:
        await new Promise((resolve) => setTimeout(resolve, 100))
        process.nextTick(() => process.exit())
      }
    },
  })

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

let dbConnection: DbConnection | undefined

export const getDbConnection = (config: IDatabaseConfig, maxPoolSize?: number): DbConnection => {
  if (dbConnection) {
    return dbConnection
  }

  log.info(
    { database: config.database, host: config.host, port: config.port },
    'Connecting to database!',
  )

  const dbInstance = getDbInstance()

  dbConnection = dbInstance({
    ...config,
    max: maxPoolSize || 5,
    query_timeout: 10000,
  })

  return dbConnection
}
