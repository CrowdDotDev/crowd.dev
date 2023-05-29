import { getRedisClient } from '@crowd/redis'
import { REDIS_CONFIG } from 'conf'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { IntegrationProcessor } from '../../serverless/integrations/services/integrationProcessor'
import { IServiceOptions } from '../../services/IServiceOptions'
import { NodeWorkerIntegrationCheckMessage } from '../../types/mq/nodeWorkerIntegrationCheckMessage'
import { NodeWorkerIntegrationProcessMessage } from '../../types/mq/nodeWorkerIntegrationProcessMessage'
import { NodeWorkerProcessWebhookMessage } from '../../types/mq/nodeWorkerProcessWebhookMessage'
import { Logger } from '../../utils/logging'

let integrationProcessorInstance: IntegrationProcessor

async function getIntegrationProcessor(logger: Logger): Promise<IntegrationProcessor> {
  if (integrationProcessorInstance) return integrationProcessorInstance

  const options: IServiceOptions = {
    ...(await SequelizeRepository.getDefaultIRepositoryOptions()),
    log: logger,
  }

  const redisEmitter = await getRedisClient(REDIS_CONFIG)

  integrationProcessorInstance = new IntegrationProcessor(options, redisEmitter)

  return integrationProcessorInstance
}

export const processIntegrationCheck = async (
  msg: NodeWorkerIntegrationCheckMessage,
  messageLogger: Logger,
): Promise<void> => {
  const processor = await getIntegrationProcessor(messageLogger)
  await processor.processCheck(msg.integrationType)
}

export const processIntegration = async (
  msg: NodeWorkerIntegrationProcessMessage,
  messageLogger: Logger,
): Promise<void> => {
  const processor = await getIntegrationProcessor(messageLogger)
  await processor.process(msg)
}

export const processWebhook = async (
  msg: NodeWorkerProcessWebhookMessage,
  messageLogger: Logger,
): Promise<void> => {
  const processor = await getIntegrationProcessor(messageLogger)
  await processor.processWebhook(msg.webhookId, msg.force, msg.fireCrowdWebhooks)
}
