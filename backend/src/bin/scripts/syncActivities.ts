import { getServiceChildLogger } from '@crowd/logging'

import { syncActivities } from '../jobs/syncActivities'

const logger = getServiceChildLogger('syncActivities')

setImmediate(async () => {
  const updatedAt = process.argv[2]

  if (!updatedAt) {
    logger.error('No updatedAt provided')
    process.exit(1)
  }

  await syncActivities(logger, updatedAt)

  process.exit(0)
})
