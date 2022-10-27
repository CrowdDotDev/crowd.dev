import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { IntegrationProcessor } from '../../serverless/integrations/services/integrationProcessor'
import { IServiceOptions } from '../../services/IServiceOptions'
import { Logger } from '../../utils/logging'
import { NodeWorkerIntegrationCheckMessage } from '../../types/mq/nodeWorkerIntegrationCheckMessage'
import { NodeWorkerIntegrationProcessMessage } from '../../types/mq/nodeWorkerIntegrationProcessMessage'

export const processIntegrationCheck = async (
  messageLogger: Logger,
  msg: NodeWorkerIntegrationCheckMessage,
): Promise<void> => {
  const options = (await SequelizeRepository.getDefaultIRepositoryOptions()) as IServiceOptions
  options.log = messageLogger

  const processor = new IntegrationProcessor(options)

  await processor.processCheck(msg.integrationType)
}

export const processIntegration = async (
  messageLogger: Logger,
  msg: NodeWorkerIntegrationProcessMessage,
): Promise<void> => {
  const options = (await SequelizeRepository.getDefaultIRepositoryOptions()) as IServiceOptions
  options.log = messageLogger

  const processor = new IntegrationProcessor(options)

  await processor.process(msg)
}
