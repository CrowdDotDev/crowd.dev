import { DATABASE_IOC, DbStore } from '@crowd/database'
import { IOC } from '@crowd/ioc'
import { LOGGING_IOC, Logger } from '@crowd/logging'
import { IntegrationStreamWorkerEmitter, SQS_IOC } from '@crowd/sqs'
import { IntegrationRunState } from '@crowd/types'
import { APP_IOC_MODULE } from 'ioc'
import IntegrationRunRepository from '../repo/integrationRun.repo'

setImmediate(async () => {
  await APP_IOC_MODULE(3)
  const ioc = IOC()

  const log = ioc.get<Logger>(LOGGING_IOC.logger)

  const processArguments = process.argv.slice(2)

  const runId = processArguments[0]
  const emitter = ioc.get<IntegrationStreamWorkerEmitter>(SQS_IOC.emitters.integrationStreamWorker)

  const store = ioc.get<DbStore>(DATABASE_IOC.store)

  const repo = new IntegrationRunRepository(store, log)

  const run = await repo.findIntegrationRunById(runId)

  if (run) {
    log.info({ run }, 'Found run!')

    if (run.state != IntegrationRunState.PENDING) {
      log.warn(`Integration run is not pending, setting to pending!`)

      await repo.resetDelayedRun(run.id)
    }

    log.info(`Triggering integration run for ${runId}!`)

    await emitter.continueProcessingRunStreams(run.tenantId, run.platform, run.id)
    process.exit(0)
  } else {
    log.error({ run }, 'Run not found!')
    process.exit(1)
  }
})
