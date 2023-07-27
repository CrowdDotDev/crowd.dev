import models from '../models'

let cached

/**
 * Initializes the connection to the Database
 */
export async function databaseInit() {
  if (!cached) {
    cached = models()
  }

  return cached
}
