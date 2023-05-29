import { getServiceLogger } from '@crowd/logging'
/**
 * This script is responsible for seeding entity data to database.
 * It has two modes through arguments. `all` OR `seederFileName`
 * It can either run all entity seeders (updates and creates)
 * using the `all` flag.
 * Or it can selectively run a single seeder using `[seederFileName]` argument
 * Examples:
 * ts-node seed-entities all => Runs all possible entity seeders in the initializers/entity folder
 * ts-node seed-entities conversations => Only runs the conversation seeder.(Useful in incremental db updates)
 */

import conversations from './entities/2022-04-27-add-conversations'
import microservices from './entities/2022-04-05-add-microservices'
import { IS_DEV_ENV } from '../../conf/index'

const log = getServiceLogger()

const arg = process.argv[2]

/**
 * Seeds all entities. Intended to be used in github actions
 * when creating :latest docker image
 */
async function seedAllEntities() {
  if (!IS_DEV_ENV) {
    throw new Error('This script is only allowed for development environment!')
  }

  await conversations()
  await microservices()
}

/**
 * This function is used to selectively run seeder functions
 * Selection is sent using the command line argument to the script
 * Intended to be used in staging/production environment for data changes
 */
async function seedSelected() {
  // eslint-disable-next-line import/no-dynamic-require
  const selectedInitializer = require(`./entities/${arg}`).default
  await selectedInitializer()
}

if (arg) {
  if (arg === 'all') {
    seedAllEntities()
  } else {
    seedSelected()
  }
} else {
  log.info(
    'This script needs an argument. To run all initializers `all`, or to run a specific initializer, `initializerName`',
  )
}
