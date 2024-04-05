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

  if (getEnv() === 'local') {
    client = new Sender()
  } else {
    client = new Sender({
      auth: {
        keyId: process.env['CROWD_QUESTDB_WRITE_KEY_ID'],
        token: process.env['CROWD_QUESTDB_WRITE_PRIVATE_KEY'],
      },
    })
  }

  return client
}
