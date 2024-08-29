import { getEnv } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'

import { Sender } from '@questdb/nodejs-client'

const log = getServiceChildLogger('questdb.ilp.connection')

let client: Sender | undefined

export const getClientILP = (): Sender => {
  if (client) {
    return client
  }

  const host = process.env['CROWD_QUESTDB_ILP_HOST']
  const port = process.env['CROWD_QUESTDB_ILP_PORT']
  const username = process.env['CROWD_QUESTDB_ILP_USERNAME']
  const password = process.env['CROWD_QUESTDB_ILP_PASSWORD']
  const autoflush = 'auto_flush=on;auto_flush_rows=10000;auto_flush_interval=10000;'

  log.trace({ host, port }, 'Creating QuestDB client (ILP) instance!')

  let conn = `http::addr=${host}:${port};${autoflush}`
  if (getEnv() !== 'local') {
    conn = `https::addr=${host}:${port};username=${username};password=${password};${autoflush}`
  }

  client = Sender.fromConfig(conn)
  return client
}
