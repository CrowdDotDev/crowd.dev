import { getEnv } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'

import pgpromise from 'pg-promise'

const log = getServiceChildLogger('questdb.sql.connection')

let client: pgpromise.IDatabase<unknown> | undefined

export const getClientSQL = async (): Promise<pgpromise.IDatabase<unknown>> => {
  if (client) {
    return client
  }

  log.info('Creating QuestDB client (SQL) instance!')

  client = pgpromise({
    // tslint:disable-next-line:max-line-length
    // see https://stackoverflow.com/questions/36120435/verify-database-connection-with-pg-promise-when-starting-an-app
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async error(err: any, e: pgpromise.IEventContext): Promise<void> {
      if (e.cn) {
        log.fatal(err, { cn: e.cn }, 'QuestDB connection error. Stopping process')
        // logs don't have flush:
        await new Promise((resolve) => setTimeout(resolve, 100))
        process.nextTick(() => process.exit())
      }

      if (e.query) {
        log.error(err, { query: e.query, params: e.params }, 'Error executing a QuestDB query!')
      }
    },
    query(e) {
      log.debug({ query: e.query, params: e.params }, 'Executing QuestDB query')
    },
  })({
    host: process.env['CROWD_QUESTDB_SQL_HOST'],
    port: Number(process.env['CROWD_QUESTDB_SQL_PORT']),
    user: process.env['CROWD_QUESTDB_SQL_USERNAME'],
    password: process.env['CROWD_QUESTDB_SQL_PASSWORD'],
    database: process.env['CROWD_QUESTDB_SQL_DATABASE'],
    application_name: process.env.SERVICE || 'unknown-app',
    ssl: getEnv() !== 'local' ? true : false,
    idleTimeoutMillis: 120000,
    max: 4,
  })

  return client
}
