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
    idleTimeoutMillis: 280000,
  })

  return client
}
