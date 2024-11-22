import { getServiceLogger } from '@crowd/logging'
import { getClientSQL } from '@crowd/questdb'

import { databaseInit } from '../database/databaseConnection'

const log = getServiceLogger()

let qdb
export async function databaseMiddleware(req, res, next) {
  try {
    const profileQueries = !!req.profileSql
    const database = await databaseInit(undefined, undefined, undefined, profileQueries)
    req.database = database
    if (!qdb) {
      qdb = await getClientSQL(profileQueries)
    }
    req.qdb = qdb
  } catch (error) {
    log.error(error, 'Database connection error!')
  } finally {
    next()
  }
}
