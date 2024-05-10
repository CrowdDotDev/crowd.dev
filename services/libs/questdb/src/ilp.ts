import { getEnv } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'

import { Sender } from '@questdb/nodejs-client'

const log = getServiceChildLogger('questdb.ilp.connection')

let client: Sender | undefined

export const getClientILP = (): Sender => {
  if (client) {
    return client
  }

  log.trace('Creating QuestDB client (ILP) instance!')

  // TODO questdb: Handle connection for staging/production.
  const conn = `http::addr=${process.env['CROWD_QUESTDB_WRITE_HOST']}:${process.env['CROWD_QUESTDB_WRITE_PORT']}`
  if (getEnv() === 'local') {
    client = Sender.fromConfig(conn)
  } else {
    client = Sender.fromConfig(conn)
  }

  return client
}
