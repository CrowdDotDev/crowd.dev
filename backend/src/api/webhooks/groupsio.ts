import IntegrationRepository from '../../database/repositories/integrationRepository'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import IncomingWebhookRepository from '../../database/repositories/incomingWebhookRepository'
import { WebhookType } from '../../types/webhooks'
import { getIntegrationStreamWorkerEmitter } from '@/serverless/utils/serviceSQS'

export default async (req, res) => {
  const signature = req.headers['x-groupsio-signature']
  const event = req.headers['x-groupsio-action']
  const data = req.body

  // TODO: Validate signature
  // TODO: tied to webhook to integration by group name / group id

  if (!data?.group?.name) {
    await req.responseHandler.error(req, res, {
      message: 'No group name found in Groups.io Webhook payload, skipping!',
    })
    return
  }

  const options = await SequelizeRepository.getDefaultIRepositoryOptions()
  const integration = await IntegrationRepository.findGroupsioIntegrationByGrounName(
    data.group.name,
    options,
  )


  if (integration) {
    req.log.info({ integrationId: integration.id }, 'Incoming Groups.io Webhook!')
    const options = await SequelizeRepository.getDefaultIRepositoryOptions()
    const repo = new IncomingWebhookRepository(options)

    const result = await repo.create({
      tenantId: integration.tenantId,
      integrationId: integration.id,
      type: WebhookType.GROUPSIO,
      payload: {
        signature,
        event,
        data,
      },
    })

    const streamEmitter = await getIntegrationStreamWorkerEmitter()

    await streamEmitter.triggerWebhookProcessing(
      integration.tenantId,
      integration.platform,
      result.id,
    )

    await req.responseHandler.success(req, res, {}, 204)
  } else {
    req.log.error({ event }, 'No integration found for incoming Groups.io Webhook!')
    await req.responseHandler.success(req, res, {}, 200)
  }
}
