import { DATABASE_IOC, DbStore } from '@crowd/database'
import { LOGGING_IOC, Logger } from '@crowd/logging'
import { IntegrationStreamState } from '@crowd/types'
import { APP_IOC_MODULE } from 'ioc'
import { APP_IOC } from 'ioc_constants'
import IntegrationStreamRepository from '../repo/integrationStream.repo'
import IntegrationStreamService from '../service/integrationStreamService'

setImmediate(async () => {
  const ioc = await APP_IOC_MODULE(3)
  const log = ioc.get<Logger>(LOGGING_IOC.logger)

  const processArguments = process.argv.slice(2)

  if (processArguments.length !== 1) {
    log.error('Expected 1 argument: streamId')
    process.exit(1)
  }

  const streamIds = processArguments[0].split(',')

  const store = ioc.get<DbStore>(DATABASE_IOC.store)
  const repo = new IntegrationStreamRepository(store, log)

  const service = ioc.get<IntegrationStreamService>(APP_IOC.streamService)
  for (const streamId of streamIds) {
    const info = await repo.getStreamData(streamId)

    if (info) {
      if (info.state !== IntegrationStreamState.PENDING) {
        await repo.resetStream(streamId)
      }

      if (info.runId && info.webhookId) {
        log.error({ streamId }, 'Stream has both runId and webhookId!')
        process.exit(1)
      }

      if (!info.runId && !info.webhookId) {
        log.error({ streamId }, 'Stream has neither runId nor webhookId!')
        process.exit(1)
      }

      try {
        if (info.runId) {
          await service.processStream(streamId)
        } else if (info.webhookId) {
          await service.processWebhookStream(info.webhookId)
        } else {
          log.error({ streamId }, 'Stream has neither runId nor webhookId!')
          process.exit(1)
        }
      } catch (err) {
        log.error(err, { streamId }, 'Error processing stream!')
      }
    } else {
      log.error({ streamId }, 'Stream not found!')
      process.exit(1)
    }
  }
})
