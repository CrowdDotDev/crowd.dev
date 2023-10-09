import { asyncWrap } from '../middleware/error'
import { WebhooksRepository } from '../repos/webhooks.repo'
import { Error400BadRequest } from '@crowd/common'
import { IntegrationStreamWorkerEmitter } from '@crowd/sqs'
import { WebhookType } from '@crowd/types'
import express from 'express'

export const installGroupsIoRoutes = async (app: express.Express) => {
  let emitter: IntegrationStreamWorkerEmitter
  app.post(
    '/groupsio',
    asyncWrap(async (req, res) => {
      const signature = req.headers['x-groupsio-signature']
      const event = req.headers['x-groupsio-action']
      const data = req.body

      // TODO: Validate signature - need to get secret from groups io for Linux
      const groupName = data?.group?.name

      if (!groupName) {
        throw new Error400BadRequest('Missing group name!')
      }

      const repo = new WebhooksRepository(req.dbStore, req.log)

      const integration = await repo.findGroupsIoIntegrationByGroupName(groupName)

      if (integration) {
        req.log.info({ integrationId: integration.id }, 'Incoming Groups.io Webhook!')

        const result = await repo.createIncomingWebhook(
          integration.tenantId,
          integration.id,
          WebhookType.GROUPSIO,
          {
            signature,
            event,
            data,
          },
        )

        if (!emitter) {
          emitter = new IntegrationStreamWorkerEmitter(req.sqs, req.log)
          await emitter.init()
        }

        await emitter.triggerWebhookProcessing(integration.tenantId, integration.platform, result)

        res.sendStatus(204)
      } else {
        req.log.error({ event, groupName }, 'No integration found for incoming Groups.io Webhook!')
        res.status(200).send({
          message: 'No integration found for incoming Groups.io Webhook!',
        })
      }
    }),
  )
}
