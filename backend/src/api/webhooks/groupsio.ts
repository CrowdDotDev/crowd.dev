import { PlatformType } from '@crowd/types'
import IntegrationRepository from '../../database/repositories/integrationRepository'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import TenantRepository from '../../database/repositories/tenantRepository'
import IncomingWebhookRepository from '../../database/repositories/incomingWebhookRepository'
import { WebhookType } from '../../types/webhooks'
import { getIntegrationStreamWorkerEmitter } from '@/serverless/utils/serviceSQS'

export default async (req, res) => {
  const signature = req.headers['x-groupsio-signature']
  const event = req.headers['x-groupsio-action']
  const data = req.body

  const options = await SequelizeRepository.getDefaultIRepositoryOptions()
  const tenant = await TenantRepository.findById(req.params.tenantId, options)
  const optionsWithTenant = await SequelizeRepository.getDefaultIRepositoryOptions(null, tenant)
  const integration = (await IntegrationRepository.findByPlatform(
    PlatformType.GROUPSIO,
    optionsWithTenant,
  )) as any

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
    req.log.error({ tenant }, 'No integration found for incoming Groups.io Webhook!')
    await req.responseHandler.success(req, res, {}, 200)
  }
}
