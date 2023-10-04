import { DATABASE_IOC, DbStore } from '@crowd/database'
import { IOC } from '@crowd/ioc'
import { LOGGING_IOC, Logger } from '@crowd/logging'
import { IntegrationRunWorkerEmitter, SQS_IOC } from '@crowd/sqs'
import { IntegrationState } from '@crowd/types'
import { APP_IOC_MODULE } from 'ioc'
import IntegrationRunRepository from '../repo/integrationRun.repo'

setImmediate(async () => {
  await APP_IOC_MODULE(3)
  const ioc = IOC()

  const log = ioc.get<Logger>(LOGGING_IOC.logger)

  const processArguments = process.argv.slice(2)

  const parameter = processArguments[0]

  const emitter = ioc.get<IntegrationRunWorkerEmitter>(SQS_IOC.emitters.integrationRunWorker)

  const store = ioc.get<DbStore>(DATABASE_IOC.store)

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

      log.info(`Triggering integration run for ${integrationId}!`)

      await emitter.triggerIntegrationRun(
        integration.tenantId,
        integration.type,
        integration.id,
        true,
      )
    } else {
      log.error({ integrationId }, 'Integration not found!')
      continue
    }
  }

  process.exit(0)
})
