import IntegrationRepository from '../../database/repositories/integrationRepository'
import TenantRepository from '../../database/repositories/tenantRepository'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import IncomingWebhookRepository from '../../database/repositories/incomingWebhookRepository'
import { WebhookType } from '../../types/webhooks'
import { sendNodeWorkerMessage } from '../../serverless/utils/nodeWorkerSQS'
import { NodeWorkerProcessWebhookMessage } from '../../types/mq/nodeWorkerProcessWebhookMessage'
import { verifyWebhookSignature } from '../../utils/crypto'
import { PlatformType } from '../../types/integrationEnums'

export default async (req, res) => {
  const signature = req.headers['x-discourse-event-signature']
  const eventId = req.headers['x-discourse-event-id']
  const eventType = req.headers['x-discourse-event-type']
  const event = req.headers['x-discourse-event']
  const data = req.body

  const options = await SequelizeRepository.getDefaultIRepositoryOptions()
  const tenant = await TenantRepository.findById(req.params.tenantId, options)
  const optionsWithTenant = await SequelizeRepository.getDefaultIRepositoryOptions(null, tenant)
  const integration = (await IntegrationRepository.findByPlatform(
    PlatformType.DISCOURSE,
    optionsWithTenant,
  )) as any

  if (integration) {
    try {
      if (!signature) {
        req.log.error({ signature }, 'Discourse Webhook signature header missing!')
        await req.responseHandler.success(
          req,
          res,
          'Discourse Webhook signature header missing!',
          200,
        )
        return
      }

      if (
        !verifyWebhookSignature(JSON.stringify(data), integration.settings.webhookSecret, signature)
      ) {
        req.log.error({ signature }, 'Discourse Webhook signature verification failed!')
        await req.responseHandler.success(
          req,
          res,
          'Discourse Webhook signature verification failed!',
          200,
        )
        return
      }
    } catch (error) {
      req.log.error({ signature, error }, 'Internal error when verifying discourse webhook')
      await req.responseHandler.success(
        req,
        res,
        'Internal error when verifying discourse webhook',
        200,
      )
      return
    }

    req.log.info({ integrationId: integration.id }, 'Incoming Discourse Webhook!')
    const options = await SequelizeRepository.getDefaultIRepositoryOptions()
    const repo = new IncomingWebhookRepository(options)

    const result = await repo.create({
      tenantId: integration.tenantId,
      integrationId: integration.id,
      type: WebhookType.DISCOURSE,
      payload: {
        signature,
        eventId,
        eventType,
        event,
        data,
      },
    })

    await sendNodeWorkerMessage(
      integration.tenantId,
      new NodeWorkerProcessWebhookMessage(integration.tenantId, result.id),
    )

    await req.responseHandler.success(req, res, {}, 204)
  } else {
    req.log.error({ tenant }, 'No integration found for incoming Discourse Webhook!')
    await req.responseHandler.success(req, res, {}, 200)
  }
}
