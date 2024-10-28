import {
  IntegrationRunWorkerEmitter,
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
} from '@crowd/common_services'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import IntegrationRunRepository from '@crowd/data-access-layer/src/old/apps/integration_run_worker/integrationRun.repo'
import { getServiceLogger } from '@crowd/logging'
import { QueueFactory } from '@crowd/queue'
import { getRedisClient } from '@crowd/redis'
import { IntegrationState } from '@crowd/types'

import { DB_CONFIG, QUEUE_CONFIG, REDIS_CONFIG } from '../conf'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

const parameter = processArguments[0]
const isOnboarding = processArguments[1] ? processArguments[1] === 'true' : true

setImmediate(async () => {
  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const redis = await getRedisClient(REDIS_CONFIG())
  const priorityLevelRepo = new PriorityLevelContextRepository(store, log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())
  const emitter = new IntegrationRunWorkerEmitter(queueClient, redis, loader, log)
  await emitter.init()

  const repo = new IntegrationRunRepository(store, log)

  const integrationIds = parameter.split(',')

  for (const integrationId of integrationIds) {
    const integration = await repo.getIntegrationData(integrationId)

    if (integration) {
      if (integration.state == IntegrationState.IN_PROGRESS) {
        log.warn(`Integration already running!`)
        continue
      }

      if (integration.state == IntegrationState.INACTIVE) {
        log.warn(`Integration is not active!`)
        continue
      }

      if (integration.state == IntegrationState.WAITING_APPROVAL) {
        log.warn(`Integration is waiting for approval!`)
        continue
      }

      log.info(`Triggering integration run for ${integrationId}, onboarding=${isOnboarding}!`)

      await emitter.triggerIntegrationRun(
        integration.tenantId,
        integration.type,
        integration.id,
        isOnboarding,
      )
    } else {
      log.error({ integrationId }, 'Integration not found!')
      continue
    }
  }

  process.exit(0)
})
