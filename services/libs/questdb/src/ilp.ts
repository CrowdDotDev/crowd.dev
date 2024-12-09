import { Sender } from '@questdb/nodejs-client'

import { getEnv } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'

const log = getServiceChildLogger('questdb.ilp.connection')

let client: Sender | undefined

export const getClientILP = (): Sender => {
  if (client) {
    return client
  }

  const host = process.env['CROWD_QUESTDB_ILP_HOST']
  const port = process.env['CROWD_QUESTDB_ILP_PORT']
  const token = process.env['CROWD_QUESTDB_ILP_TOKEN']
  const autoflush = 'auto_flush=on;auto_flush_rows=10000;auto_flush_interval=30000;'

  log.trace({ host, port }, 'Creating QuestDB client (ILP) instance!')

  let conn = `http::addr=${host}:${port};${autoflush}`
  if (getEnv() === 'prod') {
    conn = `https::addr=${host}:${port};token=${token};${autoflush}`
  }

  client = Sender.fromConfig(conn)
  return client
}
