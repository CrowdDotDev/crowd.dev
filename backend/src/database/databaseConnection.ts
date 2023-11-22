import models from './models'

let cached

/**
 * Initializes the connection to the Database
 */
export async function databaseInit(
  queryTimeoutMilliseconds: number = 30000,
  forceNewInstance: boolean = false,
  databaseHostnameOverride: string = null,
) {
  if (forceNewInstance) {
    return models(queryTimeoutMilliseconds, databaseHostnameOverride)
  }

  if (!cached) {
    cached = models(queryTimeoutMilliseconds, databaseHostnameOverride)
  }

  return cached
}
