import { databaseInit } from '../database/databaseConnection'

export async function databaseMiddleware(req, res, next) {
  try {
    const database = await databaseInit()
    req.database = database
  } catch (error) {
    console.error(error)
  } finally {
    next()
  }
}
