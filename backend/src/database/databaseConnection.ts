import models from './models'

let cached

/**
 * Initializes the connection to the Database
 */
export async function databaseInit(queryTimeoutMilliseconds: number = 30000) {
  if (!cached) {
    cached = models(queryTimeoutMilliseconds)
  }

  return cached
}
