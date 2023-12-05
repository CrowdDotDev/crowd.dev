import { ActivitySyncService, OpenSearchService } from '@crowd/opensearch'
import { DB_CONFIG, OPENSEARCH_CONFIG } from '../conf'
import { ActivityRepository } from '../repo/activity.repo'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: activityId')
  process.exit(1)
}

const activityId = processArguments[0]

setImmediate(async () => {
  const openSearchService = new OpenSearchService(log, OPENSEARCH_CONFIG())

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const service = new ActivitySyncService(store, openSearchService, log)

  const repo = new ActivityRepository(store, log)

  const results = await repo.checkActivitiesExist([activityId])

  if (results.length === 0) {
    log.error(`Activity ${activityId} not found!`)
    process.exit(1)
  } else {
    log.info(`Activity ${activityId} found! Triggering sync!`)
    await service.syncActivities([activityId])
    process.exit(0)
  }
})
