import { getServiceChildLogger } from '@crowd/logging'

import pgpromise from 'pg-promise'

const log = getServiceChildLogger('questdb.sql.connection')

let client: pgpromise.IDatabase<unknown> | undefined

export const getClientSQL = async (): Promise<pgpromise.IDatabase<unknown>> => {
  if (client) {
    return client
  }

  log.info('Creating QuestDB client (SQL) instance!')

  client = pgpromise()({
    host: process.env['CROWD_QUESTDB_READ_HOST'],
    port: Number(process.env['CROWD_QUESTDB_READ_PORT']),
    user: process.env['CROWD_QUESTDB_READ_USERNAME'],
    password: process.env['CROWD_QUESTDB_READ_PASSWORD'],
    database: process.env['CROWD_QUESTDB_READ_DATABASE'],
  })

  await client.connect()

  return client
}
