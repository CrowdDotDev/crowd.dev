import { createChildLogger, createServiceChildLogger, Logger } from '../../../utils/logging'
import { PlatformType } from '../../../types/integrationEnums'
import IntegrationRepository from '../../../database/repositories/integrationRepository'
import IncomingWebhookRepository from '../../../database/repositories/incomingWebhookRepository'
import { WebhookError, WebhookState, WebhookType } from '../../../types/webhooks'
import SequelizeRepository from '../../../database/repositories/sequelizeRepository'
import { sendNodeWorkerMessage } from '../../utils/nodeWorkerSQS'
import { NodeWorkerProcessWebhookMessage } from '../../../types/mq/nodeWorkerProcessWebhookMessage'
import GitHubWebhook from '../webhooks/github'
import { IRepositoryOptions } from '../../../database/repositories/IRepositoryOptions'

const log = createServiceChildLogger('githubWebhookWorker')

export default async function githubWebhookWorker(req) {
  const signature = req.headers['x-hub-signature']
  const event = req.headers['x-github-event']
  const data = req.body

  const identifier = data.installation.id.toString()
  const integration = (await IntegrationRepository.findByIdentifier(
    identifier,
    PlatformType.GITHUB,
  )) as any

  if (integration) {
    log.info({ integrationId: integration.id }, 'Incoming GitHub Webhook!')
    const options = await SequelizeRepository.getDefaultIRepositoryOptions()
    const repo = new IncomingWebhookRepository(options)

    const result = await repo.create({
      tenantId: integration.tenantId,
      integrationId: integration.id,
      type: WebhookType.GITHUB,
      payload: {
        signature,
        event,
        data,
      },
    })

    await sendNodeWorkerMessage(
      integration.tenantId,
      new NodeWorkerProcessWebhookMessage(integration.tenantId, result.id),
    )

    return {
      status: 204,
    }
  }

  log.error({ identifier }, 'No integration found for incoming GitHub Webhook!')
  return {
    status: 404,
  }
}

export const processWebhook = async (
  msg: NodeWorkerProcessWebhookMessage,
  messageLogger: Logger,
) => {
  const options = (await SequelizeRepository.getDefaultIRepositoryOptions()) as IRepositoryOptions
  const logger = createChildLogger('githubWebhookProcessor', messageLogger, {
    webhookId: msg.webhookId,
  })
  options.log = logger

  logger.info('Processing GitHub Webhook!')

  // load webhook to process from database
  options.transaction = await SequelizeRepository.createTransaction(options)
  const repo = new IncomingWebhookRepository(options)
  const webhook = await repo.findById(msg.webhookId)

  if (webhook) {
    if (webhook.state !== WebhookState.PENDING) {
      logger.error({ state: webhook.state }, 'Webhook is not in pending state!')
      return
    }

    try {
      await GitHubWebhook.verify(webhook.payload.signature, webhook.payload.data)

      const processor = new GitHubWebhook(webhook.payload.event, webhook.payload.data)
      await processor.main()
      await repo.markCompleted(webhook.id)
      logger.info('Webhook processed successfully!')
    } catch (err) {
      if (err.action) {
        logger.warn({ action: err.action }, 'Action not supported!')
      } else {
        logger.error(err, 'Error processing webhook!')
      }

      await repo.markError(
        webhook.id,
        new WebhookError(webhook.id, 'Error processing webhook!', err),
      )
    } finally {
      await SequelizeRepository.commitTransaction(options.transaction)
    }
  } else {
    logger.error({ webhookId: msg.webhookId }, 'Webhook not found!')
  }
}
