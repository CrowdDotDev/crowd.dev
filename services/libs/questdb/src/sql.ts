import { getServiceChildLogger } from '@crowd/logging'

import pgpromise from 'pg-promise'

const log = getServiceChildLogger('questdb.sql.connection')

let client: pgpromise.IDatabase<unknown> | undefined

export const getClientSQL = (): pgpromise.IDatabase<unknown> => {
  if (client) {
    return client
  }

  log.trace('Creating QuestDB client (SQL) instance!')

  client = pgpromise()({
    host: process.env['CROWD_QUESTDB_READ_HOST'],
    port: Number(process.env['CROWD_QUESTDB_READ_PORT']),
    user: process.env['CROWD_QUESTDB_READ_USERNAME'],
    password: process.env['CROWD_QUESTDB_READ_PASSWORD'],
    database: process.env['CROWD_QUESTDB_READ_DATABASE'],
  })

  return client
}
