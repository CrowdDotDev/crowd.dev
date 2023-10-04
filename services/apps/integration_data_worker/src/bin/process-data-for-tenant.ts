import { DATABASE_IOC, DbStore } from '@crowd/database'
import { IOC } from '@crowd/ioc'
import { LOGGING_IOC, Logger } from '@crowd/logging'
import { IntegrationDataWorkerEmitter, SQS_IOC, SqsClient } from '@crowd/sqs'
import { IntegrationStreamDataState } from '@crowd/types'
import { APP_IOC_MODULE } from 'ioc'
import IntegrationDataRepository from '../repo/integrationData.repo'

setImmediate(async () => {
  await APP_IOC_MODULE(3)
  const ioc = IOC()

  const log = ioc.get<Logger>(LOGGING_IOC.logger)

  const processArguments = process.argv.slice(2)

  if (processArguments.length !== 1) {
    log.error('Expected 1 argument: tenantId')
    process.exit(1)
  }

  const tenantId = processArguments[0]

  const sqsClient = ioc.get<SqsClient>(SQS_IOC.client)
  const emitter = new IntegrationDataWorkerEmitter(sqsClient, log)
  await emitter.init()

  const store = ioc.get<DbStore>(DATABASE_IOC.store)
  const repo = new IntegrationDataRepository(store, log)

  const dataIds = await repo.getDataForTenant(tenantId)

  for (const dataId of dataIds) {
    const info = await repo.getDataInfo(dataId)

    if (info) {
      if (info.state !== IntegrationStreamDataState.PENDING) {
        await repo.resetStream(dataId)
      }

      await emitter.triggerDataProcessing(info.tenantId, info.integrationType, dataId)
    } else {
      log.error({ dataId }, 'Data stream not found!')
      process.exit(1)
    }
  }
})
