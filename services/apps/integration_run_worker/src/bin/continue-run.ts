import { DB_CONFIG, REDIS_CONFIG, QUEUE_CONFIG, UNLEASH_CONFIG } from '../conf'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import IntegrationRunRepository from '@crowd/data-access-layer/src/old/apps/integration_run_worker/integrationRun.repo'
import { IntegrationRunState } from '@crowd/types'
import {
  IntegrationStreamWorkerEmitter,
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
} from '@crowd/common_services'
import { getUnleashClient } from '@crowd/feature-flags'
import { getRedisClient } from '@crowd/redis'
import { QueueFactory } from '@crowd/queue'

const tracer = getServiceTracer()
const log = getServiceLogger()

const processArguments = process.argv.slice(2)

const runId = processArguments[0]

setImmediate(async () => {
  const unleash = await getUnleashClient(UNLEASH_CONFIG())
  const redis = await getRedisClient(REDIS_CONFIG())

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const priorityLevelRepo = new PriorityLevelContextRepository(store, log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())
  const emitter = new IntegrationStreamWorkerEmitter(
    queueClient,
    redis,
    tracer,
    unleash,
    loader,
    log,
  )
  await emitter.init()

  const repo = new IntegrationRunRepository(store, log)

  const run = await repo.findIntegrationRunById(runId)

  if (run) {
    log.info({ run }, 'Found run!')

    if (run.state != IntegrationRunState.PENDING) {
      log.warn(`Integration run is not pending, setting to pending!`)

      await repo.resetDelayedRun(run.id)
    }

    log.info(`Triggering integration run for ${runId}!`)

    await emitter.continueProcessingRunStreams(run.tenantId, run.onboarding, run.platform, run.id)
    process.exit(0)
  } else {
    log.error({ run }, 'Run not found!')
    process.exit(1)
  }
})
