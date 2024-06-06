import { getServiceLogger } from '@crowd/logging'
import { databaseInit } from '../database/databaseConnection'

const log = getServiceLogger()

export async function databaseMiddleware(req, res, next) {
  try {
    const profileQueries = req.headers['x-profile-sql'] === 'true'
    const database = await databaseInit(undefined, undefined, undefined, profileQueries)
    req.database = database
  } catch (error) {
    log.error(error, 'Database connection error!')
  } finally {
    next()
  }
}
