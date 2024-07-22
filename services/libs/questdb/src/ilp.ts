import { getEnv } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'

import { Sender } from '@questdb/nodejs-client'

const log = getServiceChildLogger('questdb.ilp.connection')

let client: Sender | undefined

export const getClientILP = (): Sender => {
  if (client) {
    return client
  }

  const host = process.env['CROWD_QUESTDB_WRITE_HOST']
  const port = process.env['CROWD_QUESTDB_WRITE_PORT']
  const username = process.env['CROWD_QUESTDB_WRITE_USERNAME']
  const password = process.env['CROWD_QUESTDB_WRITE_PASSWORD']

  log.trace({ host, port }, 'Creating QuestDB client (ILP) instance!')

  let conn = `http::addr=${host}:${port};`
  if (getEnv() !== 'local') {
    conn = `https::addr=${host}:${port};username=${username};password=${password};`
  }

  client = Sender.fromConfig(conn)
  return client
}
