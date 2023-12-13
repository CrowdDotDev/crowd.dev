import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG, UNLEASH_CONFIG } from '../conf'
import IntegrationRunRepository from '../repo/integrationRun.repo'
import { singleOrDefault, timeout } from '@crowd/common'
import { DbStore, getDbConnection } from '@crowd/database'
import { INTEGRATION_SERVICES } from '@crowd/integrations'
import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import { getSqsClient } from '@crowd/sqs'
import {
  IntegrationRunWorkerEmitter,
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
} from '@crowd/common_services'
import { getUnleashClient } from '@crowd/feature-flags'
import { getRedisClient } from '@crowd/redis'

const tracer = getServiceTracer()
const log = getServiceLogger()

setImmediate(async () => {
  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)
  const unleash = await getUnleashClient(UNLEASH_CONFIG())
  const redis = await getRedisClient(REDIS_CONFIG())
  const priorityLevelRepo = new PriorityLevelContextRepository(store, log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const sqsClient = getSqsClient(SQS_CONFIG())
  const emitter = new IntegrationRunWorkerEmitter(sqsClient, redis, tracer, unleash, loader, log)
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
