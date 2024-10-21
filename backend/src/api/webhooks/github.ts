import { PlatformType } from '@crowd/types'

import { getIntegrationStreamWorkerEmitter } from '@/serverless/utils/queueService'

import IncomingWebhookRepository from '../../database/repositories/incomingWebhookRepository'
import IntegrationRepository from '../../database/repositories/integrationRepository'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { WebhookType } from '../../types/webhooks'

export default async (req, res) => {
  const signature = req.headers['x-hub-signature']
  const event = req.headers['x-github-event']
  const data = req.body

  const identifier = data.installation.id.toString()
  const integration = (await IntegrationRepository.findByIdentifier(
    identifier,
    PlatformType.GITHUB,
  )) as any

  if (integration) {
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

    const streamEmitter = await getIntegrationStreamWorkerEmitter()

    await streamEmitter.triggerWebhookProcessing(
      integration.tenantId,
      integration.platform,
      result.id,
    )

    await req.responseHandler.success(req, res, {}, 204)
  } else {
    req.log.error({ identifier }, 'No integration found for incoming GitHub Webhook!')
    await req.responseHandler.success(req, res, {}, 200)
  }
}
