import { getServiceChildLogger } from '@crowd/logging'

import { refreshGithubRepoSettings } from '../jobs/refreshGithubRepoSettings'

const logger = getServiceChildLogger('refreshGithubRepoSettings')

setImmediate(async () => {
  try {
    const startTime = Date.now()
    logger.info('Starting refresh of Github repo settings')

    await refreshGithubRepoSettings()

    const duration = Date.now() - startTime
    logger.info(`Completed refresh of Github repo settings in ${duration}ms`)

    process.exit(0)
  } catch (error) {
    logger.error(`Error refreshing Github repo settings: ${error.message}`)
    process.exit(1)
  }
})
