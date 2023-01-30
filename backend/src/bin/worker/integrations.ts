import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { IntegrationProcessor } from '../../serverless/integrations/services/integrationProcessor'
import { IServiceOptions } from '../../services/IServiceOptions'
import { Logger } from '../../utils/logging'
import { NodeWorkerIntegrationCheckMessage } from '../../types/mq/nodeWorkerIntegrationCheckMessage'
import { NodeWorkerIntegrationProcessMessage } from '../../types/mq/nodeWorkerIntegrationProcessMessage'
import { createRedisClient } from '../../utils/redis'

export const processIntegrationCheck = async (
  msg: NodeWorkerIntegrationCheckMessage,
  messageLogger: Logger,
): Promise<void> => {
  const options = (await SequelizeRepository.getDefaultIRepositoryOptions()) as IServiceOptions
  options.log = messageLogger

  const redisEmitter = await createRedisClient(true)

  const processor = new IntegrationProcessor(options, redisEmitter)

  await processor.processCheck(msg.integrationType)
}

export const processIntegration = async (
  msg: NodeWorkerIntegrationProcessMessage,
  messageLogger: Logger,
): Promise<void> => {
  const options = (await SequelizeRepository.getDefaultIRepositoryOptions()) as IServiceOptions
  options.log = messageLogger

  const redisEmitter = await createRedisClient(true)

  const processor = new IntegrationProcessor(options, redisEmitter)

  await processor.process(msg)
}
