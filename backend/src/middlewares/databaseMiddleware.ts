import { getServiceLogger } from '@crowd/logging'
import { getClientSQL } from '@crowd/questdb'

import { databaseInit } from '../database/databaseConnection'

const log = getServiceLogger()

let qdb
export async function databaseMiddleware(req, res, next) {
  try {
    const database = await databaseInit()
    req.database = database
    if (!qdb) {
      qdb = await getClientSQL()
    }
    req.qdb = qdb
  } catch (error) {
    log.error(error, 'Database connection error!')
  } finally {
    next()
  }
}
