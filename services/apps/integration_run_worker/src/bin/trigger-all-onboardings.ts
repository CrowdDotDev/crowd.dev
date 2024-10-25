import { singleOrDefault, timeout } from '@crowd/common'
import {
  IntegrationRunWorkerEmitter,
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
} from '@crowd/common_services'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import IntegrationRunRepository from '@crowd/data-access-layer/src/old/apps/integration_run_worker/integrationRun.repo'
import { INTEGRATION_SERVICES } from '@crowd/integrations'
import { getServiceLogger } from '@crowd/logging'
import { QueueFactory } from '@crowd/queue'
import { getRedisClient } from '@crowd/redis'

import { DB_CONFIG, QUEUE_CONFIG, REDIS_CONFIG } from '../conf'

const log = getServiceLogger()

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

  const tenantIds = await repo.getTenantsWithIntegrations()

  for (const tenantId of tenantIds) {
    const integrations = await repo.getTenantIntegrations(tenantId)

    for (const integration of integrations) {
      if (singleOrDefault(INTEGRATION_SERVICES, (s) => s.type === integration.type)) {
        log.info(
          { integrationId: integration.id },
          'Integration found in new framework - triggering onboarding!',
        )
        await emitter.triggerIntegrationRun(
          integration.tenantId,
          integration.type,
          integration.id,
          true,
        )

        log.info('Sleeping for 5 minutes between starts of integration onboarding!')
        await timeout(5 * 60 * 1000)
      }
    }

    log.info('Sleeping for 15 minutes between starts of tenant onboarding!')
    await timeout(15 * 60 * 1000)
  }

  log.info('Done!')
  process.exit(0)
})
