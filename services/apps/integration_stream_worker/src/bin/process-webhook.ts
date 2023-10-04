import { LOGGING_IOC, Logger } from '@crowd/logging'
import { APP_IOC_MODULE } from 'ioc'
import { APP_IOC } from 'ioc_constants'
import IntegrationStreamService from '../service/integrationStreamService'

setImmediate(async () => {
  const ioc = await APP_IOC_MODULE(3)

  const log = ioc.get<Logger>(LOGGING_IOC.logger)

  const processArguments = process.argv.slice(2)

  if (processArguments.length !== 1) {
    log.error('Expected 1 argument: webhookIds')
    process.exit(1)
  }

  const webhookIds = processArguments[0].split(',')

  const service = ioc.get<IntegrationStreamService>(APP_IOC.streamService)

  for (const webhookId of webhookIds) {
    try {
      await service.processWebhookStream(webhookId)
    } catch (err) {
      log.error({ webhookId, err }, 'Failed to process webhook stream!')
    }
  }

  process.exit(0)
})
