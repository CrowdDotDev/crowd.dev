import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG, UNLEASH_CONFIG } from '../conf'
import IntegrationDataRepository from '../repo/integrationData.repo'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { getSqsClient } from '@crowd/sqs'
import { IntegrationStreamDataState } from '@crowd/types'
import { getUnleashClient } from '@crowd/feature-flags'
import { getRedisClient } from '@crowd/redis'
import {
  IntegrationDataWorkerEmitter,
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
} from '@crowd/common_services'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: dataId')
  process.exit(1)
}

const dataIds = processArguments[0].split(',')

setImmediate(async () => {
  const unleash = await getUnleashClient(UNLEASH_CONFIG())
  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)
  const redisClient = await getRedisClient(REDIS_CONFIG(), true)
  const priorityLevelRepo = new PriorityLevelContextRepository(store, log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const sqsClient = getSqsClient(SQS_CONFIG())
  const emitter = new IntegrationDataWorkerEmitter(sqsClient, redisClient, unleash, loader, log)
  await emitter.init()

  const repo = new IntegrationDataRepository(store, log)

  for (const dataId of dataIds) {
    const info = await repo.getDataInfo(dataId)

    if (info) {
      if (info.state !== IntegrationStreamDataState.PENDING) {
        await repo.resetStream(dataId)
      }

      await emitter.triggerDataProcessing(
        info.tenantId,
        info.integrationType,
        dataId,
        info.onboarding === null ? true : info.onboarding,
      )
    } else {
      log.error({ dataId }, 'Data stream not found!')
      process.exit(1)
    }
  }
})
