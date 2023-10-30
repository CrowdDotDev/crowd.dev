import models from './models'

let cached

/**
 * Initializes the connection to the Database
 */
export async function databaseInit(
  queryTimeoutMilliseconds: number = 30000,
  forceNewInstance: boolean = false,
) {
  if (forceNewInstance) {
    return models(queryTimeoutMilliseconds)
  }

  if (!cached) {
    cached = models(queryTimeoutMilliseconds)
  }

  return cached
}
